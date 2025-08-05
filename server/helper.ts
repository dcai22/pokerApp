import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "./db";

/**
 * Salts and hashes a given string.
 * 
 * @param rawText - The string to be hashed and salted.
 * @returns The encrypted string.
 */
export async function genHash(rawText: string): Promise<string> {
    const saltRounds = 10;
    const salt: string = await bcrypt.genSalt(saltRounds);
    const hash: string = await bcrypt.hash(rawText, salt);
    return hash;
}

/**
 * Generates a new token for a player and inserts its hash to the database.
 * 
 * @param playerId - The ID of the player.
 * @returns A unique token for the player.
 */
export async function genToken(playerId: number): Promise<string> {
    while (true) {
        const token: string = crypto.randomBytes(64).toString('hex');
        const hash: string = await genHash(token);

        try {
            const dbRes = await pool.query(
                `INSERT INTO tokens(hash, player_id)
                VALUES($1, $2)`,
                [hash, playerId]
            );

            if (dbRes.rowCount) {
                return token;
            } else {
                throw new Error("Error in helper.ts");
            }
        } catch(err) {
            throw new Error("Error in helper.ts");
        }
    }
}

/**
 * Authenticates a user token for a specific player.
 * If successful, all other tokens are purged from the database.
 * 
 * @param token - An unhashed token.
 * @param playerId - The ID of the player being authenticated.
 * @returns The player's username if successful, or an error message otherwise.
 */
export async function authToken(token: string, playerId: number): Promise<{ username: string } | { message: string }> {
    const tokenRes = await pool.query<{ username: string; hash: string }>(
        `SELECT players.username, tokens.hash
        FROM players
        JOIN tokens ON players.id = tokens.player_id
        WHERE players.id = $1`,
        [playerId]
    );
    const playerTokens = tokenRes.rows;

    let playerToken: { username: string; hash: string } | undefined;
    for (const pt of playerTokens) {
        if (await bcrypt.compare(token, pt.hash)) {
            playerToken = pt;
            break;
        }
    }
    if (!playerToken) {
        return { message: "error: bad token" };
    } else {
        await pool.query(
            "DELETE FROM tokens WHERE player_id = $1 AND NOT hash = $2",
            [playerId, playerToken.hash]
        );
        return { username: playerToken.username };
    }
}

/**
 * Searches player details on a given table.
 * 
 * @param tableId - The ID of the table being queried.
 * @returns An array of player details, each containing the player's username, total buyin, active status, and VPIP status.
 */
export async function getTablePlayers(tableId: number): Promise<{ name: string, buyin: number, isActive: boolean, hasVpip: boolean }[]> {
    const dbRes = await pool.query(
        `SELECT
            players.username,
            COALESCE(buyin_data.total_buyin, 0) as total_buyin,
            table_players.is_active,
            CASE
                WHEN hands IS NULL THEN FALSE
                ELSE TRUE
            END AS has_vpip
        FROM tables
            JOIN table_players ON table_players.table_id = tables.id
            JOIN players ON players.id = table_players.player_id
            LEFT JOIN (
                SELECT buyins.player_id, SUM(amount) as total_buyin
                FROM buyins
                WHERE buyins.table_id = $1
                GROUP BY buyins.player_id
            ) AS buyin_data ON buyin_data.player_id = players.id
            LEFT JOIN hands ON hands.table_id = tables.id AND hands.player_id = players.id AND hands.hand_num = tables.num_hands + 1
        WHERE tables.id = $1
        ORDER BY table_players.position ASC;`,
        [tableId]
    );
    const players = dbRes.rows.map(player => {
        return {
            name: player.username,
            buyin: player.total_buyin,
            isActive: player.is_active,
            hasVpip: player.has_vpip,
        };
    });
    return players;
}

/**
 * Checks if all players on table agree to ending the game.
 * 
 * @param tableId - The ID of the table being checked.
 * @returns Whether all players on the table agree to end the game.
 */
export async function checkPlayersAgree(tableId: number): Promise<boolean> {
    try {
        const tablePlayersRes = await pool.query<{ want_end_game: boolean }>(
            `SELECT want_end_game
            FROM table_players
            WHERE table_id = $1`,
            [tableId]
        );
        const tablePlayers = tablePlayersRes.rows;

        if (tablePlayers.length === 0 || tablePlayers.some(tp => !tp.want_end_game)) {
            return false;
        } else {
            return true;
        }
    } catch (err: unknown) {
        console.log(err);
        return false;
    }
}

/**
 * Resets `want_end_game` for each player on the table to be false.
 * 
 * @param tableId - The ID of the table to update.
 */
export async function cancelPlayersAgree(tableId: number): Promise<void> {
    try {
        await pool.query(
            `UPDATE table_players
            SET want_end_game = false
            WHERE table_id = $1`,
            [tableId]
        );
    } catch (err: unknown) {
        console.log(err);
    }
}

/**
 * Generates a unique 4-digit table ID.
 * 
 * @returns A unique 4-digit table ID.
 */
export async function genTableId(): Promise<number> {
    while (true) {
        const tableId: number = Math.floor(Math.random() * 9000 + 1000);

        // check for duplicates
        try {
            const dbRes = await pool.query(
                `SELECT *
                FROM tables
                WHERE id = $1`,
                [tableId]
            );
            if (dbRes.rowCount) continue;
        } catch (err: unknown) {
            throw new Response("Error in helper.ts", { status: 400 });
        }

        return tableId;
    }
}
