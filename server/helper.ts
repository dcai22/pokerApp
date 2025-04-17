import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "./db";

export async function genHash(str: string) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(str, salt);
    return hash;
}

// generates and returns (unique) token after adding to database
export async function genToken(player_id: number) {
    while (true) {
        const token = crypto.randomBytes(64).toString('hex');
        const hash = await genHash(token);

        // check for duplicates
        try {
            const dbRes = await pool.query(
                "SELECT * FROM tokens WHERE hash=$1",
                [hash]
            );
            if (dbRes.rowCount) continue;
        } catch(err) {
            throw new Response("Error in auth.ts", { status: 400 });
        }
    
        try {
            const dbRes = await pool.query(
                "INSERT INTO tokens(hash, player_id) VALUES($1, $2)",
                [hash, player_id]
            );

            if (dbRes.rowCount) {
                return token;
            } else {
                throw new Response("Error in auth.ts", { status: 400 });
            }
        } catch(err) {
            throw new Response("Error in auth.ts", { status: 400 });
        }
    }
}

// returns { player_id, username }
export async function authToken(token: string, playerId: number) {
    const tokenRes = await pool.query(
        "SELECT * FROM tokens WHERE player_id=$1",
        [playerId]
    );
    const playerTokens = tokenRes.rows;

    const found = playerTokens.find((t) => bcrypt.compare(token, t.hash));
    if (found === undefined) {
        return { message: "error: bad token" };
    }

    const playerRes = await pool.query(
        "SELECT * FROM players WHERE id=$1",
        [playerId]
    );
    if (playerRes.rowCount) {
        const username = playerRes.rows[0].username;
        return { username };
    } else {
        return { message: "error: player not found" };
    }
}

export async function getTablePlayers(tableId: number) {
    const allTablePlayers = await pool.query(
        "SELECT * FROM table_players WHERE table_id=$1 ORDER BY position",
        [tableId]
    );
    const tablePlayers = allTablePlayers.rows;

    const allPlayers = await pool.query(
        "SELECT * FROM players"
    );
    const players = allPlayers.rows;

    const allBuyins = await pool.query(
        "SELECT player_id, SUM(amount) AS total_buyin FROM buyins WHERE table_id=$1 GROUP BY player_id",
        [tableId]
    );
    const buyins = allBuyins.rows;

    const newPlayers = tablePlayers
        .sort((a, b) => a.position -  b.position)
        .map((tp) => {
            const buyin = buyins.find((b) => b.player_id === tp.player_id);
            return {
                name: players.find((p) => p.id === tp.player_id).username,
                buyin: buyin === undefined ? '0' : buyin.total_buyin,
                isActive: tp.is_active,
            };
        });
    return newPlayers;
}
