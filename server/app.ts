import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

import pool from "./db";
import bcrypt from 'bcryptjs';
import { authToken, genToken } from './helpers/auth';

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
    const authRes = await authToken(token);
    res.json(authRes);
});

// PLAYER //
app.post('/player/createTable', async (req: Request, res: Response) => {
    const table_name = req.body.name;
    const sb = req.body.sb;
    const bb = req.body.bb;
    const player_id = req.body.player_id;

    // create table
    let table_id;
    try {
        const dbRes = await pool.query(
            "INSERT INTO tables(name, sb, bb, owner) VALUES($1, $2, $3, $4) RETURNING id;",
            [table_name, sb, bb, player_id]
        );

        if (dbRes.rowCount) {
            table_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
            return;
        }
    } catch(err) {
        res.status(400).json({ table_id: table_id });
        return;
    }

    // add player to table
    try {
        const dbRes = await pool.query(
            "SELECT * FROM table_players WHERE table_id=$1",
            [table_id]
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
            [table_id, player_id, position]
        );
        res.json({ table_id });
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.post('/player/joinTable', async (req: Request, res: Response) => {
    const player_id = req.body.player_id;
    const table_id = req.body.table_id;

    try {
        const dbRes = await pool.query(
            "SELECT * FROM table_players WHERE table_id=$1",
            [table_id]
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
            [table_id, player_id, position]
        );
        res.json();
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.delete('/player/leaveTable', async (req: Request, res: Response) => {
    const player_id = req.body.player_id;
    const table_id = req.body.table_id;

    try {
        await pool.query(
            "DELETE FROM table_players WHERE table_id=$1 AND player_id=$2",
            [table_id, player_id]
        );

        res.json();
        return;
    } catch(err) {
        res.status(400).json();
        return;
    }
});

app.put('/player/addHand', (req: Request, res: Response) => {
    // TODO
});

app.put('/player/vpip', (req: Request, res: Response) => {
    // TODO
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
