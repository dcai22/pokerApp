const connect = require("./connect");
const app = require("./app");
const port = 3000;

// Start server
app.listen(port, () => {
    connect.connectToServer();
    console.log(`Server is running on http://localhost:${port}`);
});
