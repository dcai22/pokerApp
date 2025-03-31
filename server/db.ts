import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    user: "postgres",
    password: "ligmaballs",
    host: "localhost",
    port: 5432,
    database: "poker_app"
});

export default pool;
