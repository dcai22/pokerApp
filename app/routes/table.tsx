import axios from "axios";
import type { Route } from "../+types/root";
import { useNavigate } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
    const player_id = params.player_id;
    const table_id = params.table_id;
    if (!player_id || !table_id) {
        throw new Response("Not Found", { status: 404 });
    }

    let username;
    try {
        const res = await axios.get(
            "http://localhost:3000/getPlayer",
            {
                data: { player_id },
            }
        );
        username = res.data.name;
    } catch(err) {
        throw new Response("Player does not exist", { status: 400 });
    }

    let table_name;
    try {
        const res = await axios.get(
            "http://localhost:3000/getTable",
            {
                data: { table_id },
            }
        );
        table_name = res.data.name;
    } catch(err) {
        throw new Response("Table does not exist", { status: 400 });
    }

    return { player_id, table_id, username, table_name };
}

// TODO: remove table_players entry from database upon leaving page
export default function Table({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    async function leaveTable() {
        try {
            await axios.delete(
                "http://localhost:3000/player/leaveTable",
                {
                    data: {
                        player_id: loaderData.player_id,
                        table_id: loaderData.table_id,
                    },
                }
            );

            navigate(`/joinTable/${loaderData.player_id}`);
        } catch(err) {
            throw new Response("Page not found", { status: 404 });
        }
    }

    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", leaveTable);

    return (
        <>
            Hi {loaderData.username},<br />
            Welcome to table {loaderData.table_name}!<br />
            Join code: {loaderData.table_id}<br />
            <br />
            <h1 onClick={leaveTable}>leave</h1><br />
        </>
    );
}
