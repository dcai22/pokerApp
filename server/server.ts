import { createServer } from "http";
import { Server } from "socket.io";

import { app } from "./app";
import pool from "./db";
import { cancelPlayersAgree, checkPlayersAgree, getTablePlayers } from "./helper";
const port = 3000;
import dotenv from 'dotenv';
dotenv.config();

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", process.env.CLIENT_ORIGIN as string],
        methods: ["GET", "POST", "PUT", "DELETE"],
    }
});

var sockets = new Map();
io.on("connection", (socket) => {
    console.log("a user has connected");
    const _id = socket.id;

    socket.on("connectToTable", (tableId, playerId) => {
        sockets.set(_id, { playerId, tableId });
        socket.join(tableId);
    });

    socket.on("disconnect", async () => {
        console.log("user disconnected");
        const playerData = sockets.get(_id);
        try {
            await pool.query(
                "UPDATE table_players SET is_active=false WHERE table_id=$1 AND player_id=$2",
                [playerData.tableId, playerData.playerId]
            );
            io.to(playerData.tableId).emit("updatePlayers", await getTablePlayers(playerData.tableId));

            await cancelPlayersAgree(playerData.tableId);
            socket.emit("cancelEndGame");
        } catch (err) {
            console.log(err);
        }
        sockets.delete(_id);
    });
    
    socket.on("newVote", (newYes, newNo) => {
        console.log(`Yes votes is now ${newYes}, No votes is now ${newNo}`);
        io.emit("newVote", newYes, newNo);
    });

    socket.on("joinTable", async () => {
        const playerData = sockets.get(_id);
        console.log(`New player has joined table with id=${playerData.tableId}`);

        try {
            io.to(playerData.tableId).emit("updatePlayers", await getTablePlayers(playerData.tableId));
        } catch (err) {
            console.log("error in socket.on(joinTable)");
        }
    });

    socket.on("startGame", async () => {
        try {
            const playerData = sockets.get(_id);
            await pool.query(
                "UPDATE tables SET has_started=true WHERE id=$1",
                [playerData.tableId]
            );
            io.to(playerData.tableId).emit("startGame");
            console.log(`Game started on table with id=${playerData.tableId}`);
        } catch (err) {
            console.log("error in socket.on(startGame)");
        }
    });

    socket.on("newBuyin", async (buyinTime) => {
        const playerData = sockets.get(_id);
        io.to(playerData.tableId).emit("updatePlayers", await getTablePlayers(playerData.tableId));

        await new Promise(r => setTimeout(r, 2000));
        socket.emit("removeBuyinAlert", buyinTime);
    });

    socket.on("checkHandDone", async (handNum) => {
        try {
            const playerData = sockets.get(_id);
            const activePlayersRes = await pool.query(
                "SELECT * FROM table_players WHERE table_id=$1 AND is_active=true",
                [playerData.tableId]
            );
            const activePlayerIds = activePlayersRes.rows.map((p) => p.player_id);

            const handsRes = await pool.query(
                "SELECT * FROM hands WHERE table_id=$1 AND hand_num=$2",
                [playerData.tableId, handNum]
            );
            const handPlayerIds = handsRes.rows.map((h) => h.player_id);

            if (activePlayerIds.every((p) => handPlayerIds.includes(p))) {
                io.to(playerData.tableId).emit("updateHandDone", true);
            } else {
                io.to(playerData.tableId).emit("updateHandDone", false);
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("alertNextHand", async (numHands) => {
        try {
            const playerData = sockets.get(_id);
            await pool.query(
                "UPDATE tables SET num_hands=$1 WHERE id=$2",
                [numHands, playerData.tableId]
            );
            io.to(playerData.tableId).emit("nextHand", numHands + 1);
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("changeStatus", async () => {
        try {
            const playerData = sockets.get(_id);
            const tablePlayerRes = await pool.query(
                "SELECT * FROM table_players WHERE table_id=$1 AND player_id=$2",
                [playerData.tableId, playerData.playerId]
            );
            const oldStatus = tablePlayerRes.rows[0].is_active;
            await pool.query(
                "UPDATE table_players SET is_active=$1 WHERE table_id=$2 AND player_id=$3",
                [!oldStatus, playerData.tableId, playerData.playerId]
            );

            io.to(playerData.tableId).emit("updatePlayers", await getTablePlayers(playerData.tableId));
            socket.emit("changeStatusDone");
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("leaveTable", async () => {
        try {
            const playerData = sockets.get(_id);
            await pool.query(
                "UPDATE table_players SET is_active=false WHERE table_id=$1 AND player_id=$2",
                [playerData.tableId, playerData.playerId]
            );
            
            io.to(playerData.tableId).emit("updatePlayers", await getTablePlayers(playerData.tableId));
        } catch(err) {
            console.log(err);
        }
    });

    socket.on("suggestEndGame", async () => {
        const playerData = sockets.get(_id);
        io.to(playerData.tableId).emit("endGameSuggested");
    });

    socket.on("agreeEndGame", async () => {
        const playerData = sockets.get(_id);
        try {
            await pool.query(
                "UPDATE table_players SET want_end_game=true WHERE table_id=$1 AND player_id=$2",
                [playerData.tableId, playerData.playerId]
            );

            if (await checkPlayersAgree(playerData.tableId)) {
                await pool.query(
                    "UPDATE tables SET has_ended=true WHERE id=$1",
                    [playerData.tableId]
                );
                io.to(playerData.tableId).emit("endGame");
            }
        } catch (err) {
            console.log(err);
        }
    });

    socket.on("disagreeEndGame", async () => {
        const playerData = sockets.get(_id);
        try {
            await cancelPlayersAgree(playerData.tableId);
            io.to(playerData.tableId).emit("cancelEndGame");
        } catch (err) {
            console.log(err);
        }
    });
});

// Start server
server.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
});
