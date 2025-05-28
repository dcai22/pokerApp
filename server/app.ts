import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

import pool from "./db";
import bcrypt from 'bcryptjs';
import { authToken, genToken, genTableId } from './helper';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(json());
app.use(cors({
    origin: ["http://localhost:5173", process.env.CLIENT_ORIGIN as string],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
}));

export { app };

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello world');
});

// AUTH //
// returns player_id and token
app.post('/registerPlayer', async (req: Request, res: Response) => {
    const username = req.body.username;
    const hashedPassword = req.body.hashedPassword;

    try {
        // throws an error if it fails
        const dbRes = await pool.query(
            "INSERT INTO players(username, password) VALUES($1, $2) RETURNING id",
            [username, hashedPassword]
        );
        
        if (dbRes.rowCount) {
            const player_id = dbRes.rows[0].id;
            const token = await genToken(player_id);
            res.json({ player_id, token });
            return;
        } else {
            res.status(400).json();
            return;
        }
    } catch(err) {
        console.log("Error: ", err);
        res.status(400).json();
        return;
    }
});

app.delete('/removePlayer', async (req: Request, res: Response) => {
    const playerId = req.query.playerId;

    try {
        // all tables owned by player
        const tableRes = await pool.query(
            "SELECT id FROM tables WHERE owner=$1",
            [playerId]
        );
        const tableIds = tableRes.rows.map(t => t.id);

        // delete all data related to tables owned by player
        for (const tableId of tableIds) {
            await pool.query(
                "DELETE FROM buyins WHERE table_id=$1",
                [tableId]
            );
            await pool.query(
                "DELETE FROM hands WHERE table_id=$1",
                [tableId]
            );
            await pool.query(
                "DELETE FROM table_players WHERE table_id=$1",
                [tableId]
            );
            await pool.query(
                "DELETE FROM tables WHERE id=$1",
                [tableId]
            );
        }

        // delete all data related to player
        await pool.query(
            "DELETE FROM tokens WHERE player_id=$1;",
            [playerId]
        );
        await pool.query(
            "DELETE FROM table_players WHERE player_id=$1;",
            [playerId]
        );
        await pool.query(
            "DELETE FROM hands WHERE player_id=$1;",
            [playerId]
        );
        await pool.query(
            "DELETE FROM buyins WHERE player_id=$1;",
            [playerId]
        );
        await pool.query(
            "DELETE FROM players WHERE id=$1;",
            [playerId]
        );

        res.json();
    } catch (err) {
        console.log(err);
    }
});

app.post('/login', async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    let hashedPassword;
    let player_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE username=$1",
            [username]
        );

        if (dbRes.rowCount) {
            hashedPassword = dbRes.rows[0].password;
            player_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
            return;
        }
    } catch(err) {
        res.status(400).json();
        return;
    }

    if (await bcrypt.compare(password, hashedPassword)) {
        await pool.query(
            "DELETE FROM tokens WHERE player_id=$1",
            [player_id]
        );
        const token = await genToken(player_id);
        res.json({ player_id, token });
        return;
    } else {
        res.status(400).json();
        return;
    }
});

app.delete('/deleteToken', async (req: Request, res: Response) => {
    const playerId = req.query.playerId;
    const token = req.query.token as string;

    const dbRes = await pool.query(
        "SELECT hash FROM tokens WHERE player_id=$1",
        [playerId]
    );
    const allHashes = dbRes.rows.map(t => t.hash);

    for (const dbHash of allHashes) {
        if (await bcrypt.compare(token, dbHash)) {
            await pool.query(
                "DELETE FROM tokens WHERE hash=$1",
                [dbHash]
            );
            res.json();
            return;
        }
    }

    res.json();
});

// returns { player_id, username } of player corresponding to token
app.post('/authToken', async (req: Request, res: Response) => {
    const token = req.body.token;
    const playerId = req.body.playerId;
    const authRes = await authToken(token, playerId);
    res.json(authRes);
});

// PLAYER //
app.post('/player/createTable', async (req: Request, res: Response) => {
    const tableName = req.body.tableName;
    const sb = req.body.sb;
    const bb = req.body.bb;
    const playerId = req.body.playerId;

    // create table
    let tableId = await genTableId();
    try {
        const dbRes = await pool.query(
            "INSERT INTO tables(id, name, sb, bb, owner) VALUES($1, $2, $3, $4, $5);",
            [tableId, tableName, sb, bb, playerId]
        );

        if (dbRes.rowCount === 0) {
            res.status(400).json();
            return;
        }
    } catch(err) {
        console.log("Error: ", err);
        res.status(400).json();
        return;
    }

    // add player to table
    try {
        const dbRes = await pool.query(
            "SELECT * FROM table_players WHERE table_id=$1",
            [tableId]
        );
        const positions = dbRes.rows.map((e) => e.position);
        if (positions.length >= 9) {
            res.status(400).json();
            return;
        }
        let position;
        do {
            position = Math.floor(Math.random() * (9));
        } while (positions.includes(position))

        await pool.query(
            "INSERT INTO table_players(table_id, player_id, position) VALUES($1, $2, $3)",
            [tableId, playerId, position]
        );
        res.json({ tableId });
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.post('/player/joinTable', async (req: Request, res: Response) => {
    const playerId = req.body.playerId;
    const tableId = req.body.tableId;

    try {
        const tableRes = await pool.query(
            "SELECT * FROM tables WHERE id=$1",
            [tableId]
        );
        const table = tableRes.rows[0];
        // if (tableRes.rows[0].has_started) {
        //     res.status(400).json();
        //     return;
        // }

        const allTablePlayersRes = await pool.query(
            "SELECT * FROM table_players WHERE table_id=$1",
            [tableId]
        );
        const allTablePlayers = allTablePlayersRes.rows;

        if (allTablePlayers.find((tp) => tp.player_id === playerId)) {
            res.json();
            return;
        }

        const positions = allTablePlayers.map((e) => e.position);
        if (positions.length >= 9) {
            res.status(400).json({ error: `Cannot join table ${tableId}: table is full` });
            return;
        }
        let position;
        do {
            position = Math.floor(Math.random() * (9));
        } while (positions.includes(position))

        await pool.query(
            "INSERT INTO table_players(table_id, player_id, position) VALUES($1, $2, $3)",
            [tableId, playerId, position]
        );
        res.json();
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.put('/player/leaveTable', async (req: Request, res: Response) => {
    const playerId = req.body.playerId;
    const tableId = req.body.tableId;

    try {
        await pool.query(
            "UPDATE table_players SET is_active=false WHERE table_id=$1 AND player_id=$2",
            [tableId, playerId]
        );

        res.json();
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.post('/player/buyin', async (req: Request, res: Response) => {
    const amount = req.body.amount;
    const buyinTime = req.body.buyinTime;
    const tableId = req.body.tableId;
    const playerId = req.body.playerId;

    try {
        const dbRes = await pool.query(
            "INSERT INTO buyins(player_id, table_id, time, amount) VALUES($1, $2, $3, $4)",
            [playerId, tableId, buyinTime, amount]
        );

        if (dbRes.rowCount) {
            res.json();
        } else {
            res.status(400).json({ message: "Error creating new buyin" });
        }
    } catch (err) {
        res.status(400).json({ message: "Error creating new buyin" });
    }
});

app.get('/player/getBuyins', async (req: Request, res: Response) => {
    const tableId = req.query.tableId;

    try {
        const buyinsRes = await pool.query(
            "SELECT * FROM buyins WHERE table_id=$1 ORDER BY time DESC",
            [tableId]
        );
        const buyins = buyinsRes.rows;

        if (buyins.length === 0) {
            res.json({  buyins: [] });
            return;
        }

        const playersRes = await pool.query(
            "SELECT * FROM players",
        );
        const players = playersRes.rows;

        res.json({ buyins: buyins.map((b) => {
            return {
                name: players.find((p) => p.id === b.player_id).username,
                time: b.time,
                amount: b.amount,
            }
        }) });
    } catch (err) {
        res.status(400).json({ message: "Error fetching buyins" });
    }
});

app.get('/player/getHands', async (req: Request, res: Response) => {
    const playerId = req.query.playerId;
    const tableId = req.query.tableId;

    try {
        const dbRes = await pool.query(
            "SELECT * FROM hands WHERE player_id=$1 AND table_id=$2",
            [playerId, tableId]
        );

        const hands = dbRes.rows.map((h) => {
            return {
                handNum: h.hand_num,
                cid: h.combination_id,
                vpip: h.vpip,
            };
        });
        res.json({ hands });
    } catch (err) {
        console.log(err);
    }
});

// Will only be called to UPDATE the `hands` schema
// if VPIP first: then a row is created and it is updated here
// if hand is entered first: nothing is submitted until 'VPIP' is completed
app.put('/player/addHand', async (req: Request, res: Response) => {
    const playerId = req.body.playerId;
    const tableId = req.body.tableId;
    const handNum = req.body.handNum;
    const handCid = req.body.handCid;

    try {
        await pool.query(
            "UPDATE hands SET combination_id=$1 WHERE player_id=$2 AND table_id=$3 AND hand_num=$4",
            [handCid, playerId, tableId, handNum]
        );
        res.json();
    } catch (err) {
        res.status(400).json({ err });
    }
});

// Adds both vpip and hand to database
app.post('/player/vpip', async (req: Request, res: Response) => {
    const playerId = req.body.playerId;
    const tableId = req.body.tableId;
    const handNum = req.body.handNum;
    const handCid = req.body.handCid;
    const vpip = req.body.vpip;

    try {
        await pool.query(
            "INSERT INTO hands(player_id, table_id, hand_num, combination_id, vpip) VALUES($1, $2, $3, $4, $5)",
            [playerId, tableId, handNum, handCid, vpip]
        );
        res.json();
    } catch (err) {
        res.status(400).json({ err });
    }
});

app.get('/player/getVpip', (req: Request, res: Response) => {
    // TODO
});

app.get('/player/handStats', (req: Request, res: Response) => {
    // TODO
});


// GETTERS //
app.get('/getPlayer', async (req: Request, res: Response) => {
    const player_id = req.query.player_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE id=$1",
            [player_id]
        );

        if (dbRes.rowCount) {
            res.json(dbRes.rows[0]);
            return;
        } else {
            res.status(400).json();
            return;
        }
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.get('/getTable', async (req: Request, res: Response) => {
    const table_id = req.query.table_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM tables WHERE id=$1",
            [table_id]
        );

        if (dbRes.rowCount) {
            res.json(dbRes.rows[0]);
            return;
        } else {
            res.status(400).json();
            return;
        }
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.get('/getTablePlayer', async (req: Request, res: Response) => {
    const tableId = req.query.tableId;
    const playerId = req.query.playerId;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM table_players WHERE table_id=$1 AND player_id=$2",
            [tableId, playerId]
        );

        if (dbRes.rowCount) {
            res.json(dbRes.rows[0]);
            return;
        } else {
            res.status(400).json({ err: "Player does not exist on table" });
            return;
        }
    } catch(err) {
        res.status(400).json({ err });
        return;
    }
});

app.get('/getHand', async (req: Request, res: Response) => {
    const tableId = req.query.tableId;
    const playerId = req.query.playerId;
    const handNum = req.query.handNum;

    try {
        const dbRes = await pool.query(
            "SELECT * FROM hands WHERE table_id=$1 AND player_id=$2 AND hand_num=$3",
            [tableId, playerId, handNum]
        );
        if (dbRes.rowCount) {
            res.json({ handExists: true, hand: dbRes.rows[0] });
        } else {
            res.json({ handExists: false });
        }
    } catch (err) {
        console.log(err);
        res.status(400).json();
    }
});

app.get('/getAllHands', async (req: Request, res: Response) => {
    const tableId = req.query.tableId;

    try {
        // check table has ended
        const tableRes = await pool.query(
            "SELECT * FROM tables WHERE id=$1",
            [tableId]
        );
        if (!tableRes.rows[0].has_ended) {
            res.status(400).json();
            return;
        }

        const playersRes = await pool.query(
            "SELECT * FROM players"
        );
        const players = playersRes.rows;

        const handsRes = await pool.query(
            "SELECT * FROM hands WHERE table_id=$1",
            [tableId]
        );
        const hands = handsRes.rows.map(h => {
            return {
                name: players.find(p => p.id === h.player_id).username,
                handNum: h.hand_num,
                cid: h.combination_id,
                vpip: h.vpip,
            };
        });
        res.json({ hands });
    } catch (err) {
        console.log(err);
    }
});


// FOR TESTING
app.get('/numVotes', async (req: Request, res: Response) => {
    try {
        const allVotes = await pool.query("SELECT * FROM test WHERE id=1");
        res.json(allVotes.rows[0]);
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});
app.put('/updateVotes', async (req: Request, res: Response) => {
    const numYes = req.body.numYes as number;
    const numNo = req.body.numNo as number;
    try {
        await pool.query(
            "UPDATE test SET num_yes=$1, num_no=$2 WHERE id=1",
            [numYes, numNo]
        );
        res.json("res was updated");
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});
