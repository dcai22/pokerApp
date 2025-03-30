import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

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
