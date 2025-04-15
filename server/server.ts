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

var sockets = new Map();
io.on("connection", (socket) => {
    console.log("a user has connected");
    const _id = socket.id;

    socket.on("connectToTable", (tableId, playerId) => {
        sockets.set(_id, { playerId, tableId });
    });

    socket.on("disconnect", async () => {
        console.log("user disconnected");
        const playerData = sockets.get(_id);
        try {
            await pool.query(
                "UPDATE table_players SET is_active=false WHERE table_id=$1 AND player_id=$2",
                [playerData.tableId, playerData.playerId]
            );
            io.emit("updatePlayers", await getTablePlayers(playerData.tableId));
        } catch (err) {
            console.log(err);
        }
        sockets.delete(_id);
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

    socket.on("checkHandDone", async (tableId, handNum) => {
        try {
            const activePlayersRes = await pool.query(
                "SELECT * FROM table_players WHERE table_id=$1 AND is_active=true",
                [tableId]
            );
            const activePlayerIds = activePlayersRes.rows.map((p) => p.player_id);

            const handsRes = await pool.query(
                "SELECT * FROM hands WHERE table_id=$1 AND hand_num=$2",
                [tableId, handNum]
            );
            const handPlayerIds = handsRes.rows.map((h) => h.player_id);

            if (activePlayerIds.every((p) => handPlayerIds.includes(p))) {
                io.emit("updateHandDone", true);
            } else {
                io.emit("updateHandDone", false);
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("alertNextHand", async (tableId, numHands) => {
        try {
            await pool.query(
                "UPDATE tables SET num_hands=$1 WHERE id=$2",
                [numHands, tableId]
            );
            io.emit("nextHand", numHands + 1);
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("changeStatus", async (tableId, playerId) => {
        try {
            const tablePlayerRes = await pool.query(
                "SELECT * FROM table_players WHERE table_id=$1 AND player_id=$2",
                [tableId, playerId]
            );
            const oldStatus = tablePlayerRes.rows[0].is_active;
            await pool.query(
                "UPDATE table_players SET is_active=$1 WHERE table_id=$2 AND player_id=$3",
                [!oldStatus, tableId, playerId]
            );

            io.emit("updatePlayers", await getTablePlayers(tableId));
            socket.emit("changeStatusDone");
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("leaveTable", async (tableId, playerId) => {
        try {
            await pool.query(
                "UPDATE table_players SET is_active=false WHERE table_id=$1 AND player_id=$2",
                [tableId, playerId]
            );
            
            io.emit("updatePlayers", await getTablePlayers(tableId));
        } catch(err) {
            console.log(err);
        }
    });
});

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
