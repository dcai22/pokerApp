import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

// FOR DEVELOPMENT
// const pool = new Pool({
//     user: "postgres",
//     password: process.env.LOCAL_DB_PASSWORD,
//     host: "localhost",
//     port: 5432,
//     database: "poker_app"
// });

// FOR DEPLOYMENT
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export default pool;