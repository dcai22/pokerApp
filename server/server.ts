import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import axios from "axios";
import pool from "./db";
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

    socket.on("joinTable", async (table_id) => {
        console.log(`New player has joined table with id=${table_id}`);

        try {
            const allTablePlayers = await pool.query(
                "SELECT * FROM table_players WHERE table_id=$1",
                [table_id]
            );
            const tablePlayers = allTablePlayers.rows;

            const allPlayers = await pool.query(
                "SELECT * FROM players"
            );
            const players = allPlayers.rows;

            const newPlayers = tablePlayers
                .sort((a, b) => a.position -  b.position)
                .map((tp) => players.find((p) => p.id === tp.player_id).username)
                .map((p) => {
                    return { name: p, buyin: 0 };
                });
            io.emit("updatePlayers", newPlayers);
        } catch (err) {
            console.log("error in socket.on(joinTable)");
        }
    });

    socket.on("startGame", async (table_id) => {
        try {
            await pool.query(
                "UPDATE tables SET has_started=true WHERE id=$1",
                [table_id]
            );
            io.emit("startGame");
            console.log(`Game started on table with id=${table_id}`);
        } catch (err) {
            console.log("error in socket.on(startGame)");
        }
    });

    socket.on("newBuyin", async (buyinTime, table_id, player_id) => {
        // DO STUFF WITH DB

        await new Promise(r => setTimeout(r, 2000));
        socket.emit("removeBuyinAlert", buyinTime);
    });
});

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
