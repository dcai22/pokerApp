const connect = require("./connect");
const app = require("./app");
const port = 3000;

import { connectToServer, getDb } from "./connect";

// Start server
app.listen(port, async () => {
    connectToServer();
    console.log(`Server is running on http://localhost:${port}`);
});
