import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
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
            // TODO: emit only to the table
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
            // TODO: emit only to the table
            io.emit("startGame");
            console.log(`Game started on table with id=${tableId}`);
        } catch (err) {
            console.log("error in socket.on(startGame)");
        }
    });

    socket.on("newBuyin", async (buyinTime, tableId) => {
        // TODO: emit only to the table
        io.emit("updatePlayers", await getTablePlayers(tableId));

        await new Promise(r => setTimeout(r, 2000));
        socket.emit("removeBuyinAlert", buyinTime);
    });

    socket.on("vpip", async (tableId, handNum) => {
        try {            
            const playerCountRes = await pool.query(
                "SELECT COUNT(*) FROM table_players WHERE table_id=$1",
                [tableId]
            );

            const readyCountRes = await pool.query(
                "SELECT COUNT(*) FROM hands WHERE table_id=$1 AND hand_num=$2",
                [tableId, handNum]
            );

            if (playerCountRes.rows[0].count === readyCountRes.rows[0].count) {
                io.emit("handDone");
            }
        } catch (err) {
            console.log(err);
        }
    })
});

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
