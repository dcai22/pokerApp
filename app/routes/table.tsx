import axios from "axios";
import type { Route } from "../+types/root";
import { redirect, useNavigate } from "react-router";
import { getSession } from "~/sessions.server";
import { authToken } from "server/helpers/auth";
import Greeting from "~/components/Greeting";
import { Button } from "~/components/ui/button";
import TableWelcome from "~/components/TableWelcome";

export async function loader({ request, params }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (!session.has("userId")) {
        return redirect("/login");
    }
    const token = session.get("userId");
    let player_id;
    try {
        player_id = await authToken(token as string);
    } catch(err) {
        throw new Response("Error in joinTable", { status: 400 });
    }

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
        username = res.data.username;
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

            navigate(`/joinTable`);
        } catch(err) {
            throw new Response("Page not found", { status: 404 });
        }
    }

    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", leaveTable);

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <Greeting name={loaderData.username} />
            <TableWelcome name={loaderData.table_name} code={loaderData.table_id} />
            
            <Button onClick={leaveTable}>Leave table</Button>
        </div>
    );
}
