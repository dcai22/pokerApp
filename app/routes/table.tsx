import axios from "axios";
import type { Route } from "../+types/root";
import { useNavigate } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
    const username = params.username;
    // TODO: use table_id instead of table_name
    const table_name = params.table_name;
    if (!table_name) {
        throw new Response("Not Found", { status: 404 });
    }
    return { username, table_name };
}

export default function Table({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    async function leaveTable() {
        try {
            await axios.delete(
                "http://localhost:3000/player/leaveTable",
                {
                    data: {
                        username: loaderData.username,
                        table_name: loaderData.table_name,
                    },
                }
            );

            navigate(`/joinTable/${loaderData.username}`);
        } catch(err) {
            throw new Response("Page not found", { status: 404 });
        }
    }

    return (
        <>
            Hi {loaderData.username},<br />
            Welcome to table {loaderData.table_name}!<br />
            <br />
            <h1 onClick={leaveTable}>leave</h1><br />
        </>
    );
}
