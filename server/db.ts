import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

// const pool = new Pool({
//     user: "postgres",
//     password: "ligmaballs",
//     host: "localhost",
//     port: 5432,
//     database: "poker_app"
// });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
console.log(process.env.DATABASE_URL);

export default pool;
