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

app.post('/registerUser', (req: Request, res: Response) => {
    // TODO;
});

app.delete('/removeUser', (req: Request, res: Response) => {
    // TODO;
});

app.post('/user/createTable', (req: Request, res: Response) => {
    // TODO;
});

app.post('/user/joinTable', (req: Request, res: Response) => {
    // TODO
});

app.delete('/user/leaveTable', (req: Request, res: Response) => {
    // TODO;
});

app.put('/user/addHand', (req: Request, res: Response) => {
    // TODO;
});

app.put('/user/vpip', (req: Request, res: Response) => {
    // TODO;
});

app.get('/user/getVpip', (req: Request, res: Response) => {
    // TODO;
});

app.get('/user/handStats', (req: Request, res: Response) => {
    // TODO;
});
