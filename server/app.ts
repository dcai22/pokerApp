import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

import pool from "./db";

const app = express();

app.use(json());
app.use(cors());

module.exports = app;

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello world');
});

app.post('/registerPlayer', async (req: Request, res: Response) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        // throws an error if it fails
        const dbRes = await pool.query(
            "INSERT INTO players(username, password) VALUES($1, $2)",
            [username, password]
        );
        res.json(dbRes);
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

    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE username=$1 AND password=$2",
            [username, password]
        );
        res.json(dbRes);
    } catch(err) {
        res.status(400).json();
    }
});

app.post('/player/createTable', async (req: Request, res: Response) => {
    const table_name = req.body.name;
    const sb = req.body.sb;
    const bb = req.body.bb;

    // const username = req.params.username;
    const username = req.body.username;
    let owner_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE username=$1",
            [username]
        );
        owner_id = dbRes.rows[0].id;
    } catch(err) {
        res.status(400).json();
    }

    // create table
    try {
        const dbRes = await pool.query(
            "INSERT INTO tables(name, sb, bb, owner) VALUES($1, $2, $3, $4);",
            [table_name, sb, bb, owner_id]
        );

        if (!dbRes.rowCount) {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }

    // get table_id
    let table_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM tables WHERE name=$1",
            [table_name]
        );

        table_id = dbRes.rows[0].id;
    } catch(err) {
        res.status(400).json();
    }

    // add player to table
    try {
        await pool.query(
            "INSERT INTO table_players(table_id, player_id) VALUES($1, $2)",
            [table_id, owner_id]
        );
        res.json();
    } catch(err) {
        res.status(400).json();
    }
});

// TODO: use table_id instead of table_name
app.post('/player/joinTable', async (req: Request, res: Response) => {
    const username = req.body.username;
    const table_name = req.body.table_name;
    let player_id;
    let table_id;

    // get player_id from username
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE username=$1",
            [username]
        );
        if (dbRes.rowCount) {
            player_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }

    // get table_id from table_name
    try {
        const dbRes = await pool.query(
            "SELECT * FROM tables WHERE name=$1",
            [table_name]
        );
        if (dbRes.rowCount) {
            table_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }

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
    const username = req.body.username;
    const table_name = req.body.table_name;

    // get player_id
    let player_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM players WHERE username=$1",
            [username]
        );
        
        if (dbRes.rowCount) {
            player_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }

    // get table_id
    let table_id;
    try {
        const dbRes = await pool.query(
            "SELECT * FROM tables WHERE name=$1",
            [table_name]
        );
        
        if (dbRes.rowCount) {
            table_id = dbRes.rows[0].id;
        } else {
            res.status(400).json();
        }
    } catch(err) {
        res.status(400).json();
    }

    try {
        const dbRes = await pool.query(
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
