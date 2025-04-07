import { createServer } from "http";
import { Server } from "socket.io";

const app = require("./app");
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
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
});

// Start server
server.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
