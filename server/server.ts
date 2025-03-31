const app = require("./app");
const pool = require("./db");
const port = 3000;

// Start server
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
});
