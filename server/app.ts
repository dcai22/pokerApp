import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

import pool from "./db";
import { Player } from './interface';
import { blob } from 'stream/consumers';

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
        res.json();
    } catch(err) {
        res.status(400).json();
    }
});

app.delete('/removePlayer', (req: Request, res: Response) => {
    // TODO;
});

app.post('/player/createTable', async (req: Request, res: Response) => {
    const table_name = req.body.name;
    const sb = req.body.sb;
    const bb = req.body.bb;

    // const username = req.params.username;
    const username = req.body.username;
    let owner;
    try {
        const allOwners = await pool.query(
            "SELECT * FROM players WHERE username=$1",
            [username]
        );
        owner = allOwners.rows[0].id;
    } catch(err) {
        res.status(400).json();
    }

    try {
        await pool.query(
            "INSERT INTO tables(name, sb, bb, owner) VALUES($1, $2, $3, $4)",
            [table_name, sb, bb, owner]
        );
    } catch(err) {
        res.status(400).json();
    }
});

app.post('/player/joinTable', (req: Request, res: Response) => {
    // TODO
});

app.delete('/player/leaveTable', (req: Request, res: Response) => {
    // TODO;
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
