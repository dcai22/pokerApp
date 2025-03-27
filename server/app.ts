import express, { json, type Request, type Response } from 'express';
import cors from 'cors';

const app = express();

app.use(json());
app.use(cors());

module.exports = app;

// Routes
app.get('/', (req: Request, res: Response) => {
    res.send('Hello world');
})
