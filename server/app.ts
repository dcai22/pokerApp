import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

import pool from "./db";
import bcrypt from 'bcryptjs';

const app = express();

app.use(json());
app.use(cors());

module.exports = app;

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello world');
});

// returns player_id
app.post('/registerPlayer', async (req: Request, res: Response) => {
    const username = req.body.username;
    const hash = req.body.hash;

    try {
        // throws an error if it fails
        const dbRes = await pool.query(
            "INSERT INTO players(username, password) VALUES($1, $2) RETURNING id",
            [username, hash]
        );

        if (dbRes.rowCount) {
            res.json({ player_id: dbRes.rows[0].id })
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }
});

app.delete('/removePlayer', (req: Request, res: Response) => {
    // TODO
});

// TODO: add tokens
app.post('/login', async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    let hash;
    let player_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE username=$1",
            [username]
        );

        if (dbRes.rowCount) {
            hash = dbRes.rows[0].password;
            player_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }

    if (await bcrypt.compare(password, hash)) {
        res.json({ player_id });
    } else {
        res.status(400).json();
    }
});

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
        }
    } catch(err) {
        res.status(400).json({ table_id: table_id });
    }

    // add player to table
    try {
        await pool.query(
            "INSERT INTO table_players(table_id, player_id) VALUES($1, $2)",
            [table_id, player_id]
        );
        res.json({ table_id });
    } catch(err) {
        res.status(400).json();
    }
});

app.post('/player/joinTable', async (req: Request, res: Response) => {
    const player_id = req.body.player_id;
    const table_id = req.body.table_id;

    try {
        await pool.query(
            "INSERT INTO table_players(table_id, player_id) VALUES($1, $2)",
            [table_id, player_id]
        );
        res.json();
    } catch(err) {
        res.status(400).json();
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
    } catch(err) {
        res.status(400).json();
    }
});

app.put('/player/addHand', (req: Request, res: Response) => {
    // TODO;
});

app.put('/player/vpip', (req: Request, res: Response) => {
    // TODO;
});

app.get('/player/getVpip', (req: Request, res: Response) => {
    // TODO;
});

app.get('/player/handStats', (req: Request, res: Response) => {
    // TODO;
});


// GETTERS //
app.get('/getPlayer', async (req: Request, res: Response) => {
    const player_id = req.body.player_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE id=$1",
            [player_id]
        );
        
        if (dbRes.rowCount) {
            res.json(dbRes.rows[0]);
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }
});

app.get('/getTable', async (req: Request, res: Response) => {
    const table_id = req.body.table_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM tables WHERE id=$1",
            [table_id]
        );

        if (dbRes.rowCount) {
            res.json(dbRes.rows[0]);
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }
});


// FOR TESTING
app.get('/numVotes', async (req: Request, res: Response) => {
    try {
        const allVotes = await pool.query("SELECT * FROM test WHERE id=1");
        res.json(allVotes.rows[0]);
    } catch(err) {
        res.status(400).json();
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
    } catch(err) {
        res.status(400).json();
    }
});
