import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import axios from "axios";
import pool from "./db";
import { getTablePlayers } from "./helper";
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
});

io.on("connection", (socket) => {
    console.log("a user has connected");

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
    
    socket.on("newVote", (newYes, newNo) => {
        console.log(`Yes votes is now ${newYes}, No votes is now ${newNo}`);
        io.emit("newVote", newYes, newNo);
    });

    socket.on("joinTable", async (tableId) => {
        console.log(`New player has joined table with id=${tableId}`);

        try {
            io.emit("updatePlayers", await getTablePlayers(tableId));
        } catch (err) {
            console.log("error in socket.on(joinTable)");
        }
    });

    socket.on("startGame", async (tableId) => {
        try {
            await pool.query(
                "UPDATE tables SET has_started=true WHERE id=$1",
                [tableId]
            );
            io.emit("startGame");
            console.log(`Game started on table with id=${tableId}`);
        } catch (err) {
            console.log("error in socket.on(startGame)");
        }
    });

    socket.on("newBuyin", async (buyinTime, tableId, playerId) => {
        io.emit("updatePlayers", await getTablePlayers(tableId));

        await new Promise(r => setTimeout(r, 2000));
        socket.emit("removeBuyinAlert", buyinTime);
    });
});

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
