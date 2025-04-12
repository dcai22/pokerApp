import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../db";

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
export async function authToken(token: string) {
    const tokenRes = await pool.query("SELECT * FROM tokens");
    const allTokens = tokenRes.rows;

    let player_id;
    for (const dbToken of allTokens) {
        if (await bcrypt.compare(token, dbToken.hash)) {
            player_id = dbToken.player_id;
            break;
        }
    }
    if (!player_id) {
        return null;
    }

    let username;
    const playerRes = await pool.query(
        "SELECT * FROM players WHERE id=$1",
        [player_id]
    );
    if (playerRes.rowCount) {
        username = playerRes.rows[0].username;
        return { player_id, username };
    } else {
        return null;
    }
}

export async function deleteLocalTokens() {
}
