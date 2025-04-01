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

app.post('/registerPlayer', (req: Request, res: Response) => {
    // TODO;
});

app.delete('/removePlayer', (req: Request, res: Response) => {
    // TODO;
});

app.post('/player/createTable', (req: Request, res: Response) => {
    // TODO;
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
        console.log(allVotes.rows[0]);
    } catch(err) {
        console.log(err);
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
        console.log(err);
    }
});
