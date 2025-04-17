import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

import pool from "./db";
import bcrypt from 'bcryptjs';
import { authToken, genToken } from './helper';
import { RESERVED_EVENTS } from 'node_modules/socket.io/dist/socket-types';

const app = express();

app.use(json());
app.use(cors({
    origin: "http://localhost:5173",
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
        res.status(400).json();
        return;
    }
});

app.delete('/removePlayer', (req: Request, res: Response) => {
    // TODO
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
        const token = await genToken(player_id);
        res.json({ player_id, token });
        return;
    } else {
        res.status(400).json();
        return;
    }
});

app.delete('/deleteToken', async (req: Request, res: Response) => {
    const token = req.body.token;

    const dbRes = await pool.query("SELECT hash FROM tokens");
    const allTokens = dbRes.rows;

    for (const dbToken of allTokens) {
        if (await bcrypt.compare(token, dbToken.hash)) {
            await pool.query(
                "DELETE FROM tokens WHERE hash=$1",
                [dbToken.hash]
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
    let tableId;
    try {
        const dbRes = await pool.query(
            "INSERT INTO tables(name, sb, bb, owner) VALUES($1, $2, $3, $4) RETURNING id;",
            [tableName, sb, bb, playerId]
        );

        if (dbRes.rowCount) {
            tableId = dbRes.rows[0].id;
        } else {
            res.status(400).json();
            return;
        }
    } catch(err) {
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
    const playerId = req.query.playerId; // DEBUG: value is -1 for some reason?
    const tableId = req.query.tableId;

    try {
        const dbRes = await pool.query(
            "SELECT * FROM buyins WHERE player_id=$1 AND table_id=$2 ORDER BY time DESC",
            [playerId, tableId]
        );
        res.json({ buyins: dbRes.rows });
    } catch (err) {
        res.status(400).json({ message: "Error fetching buyins" });
    }
})

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
