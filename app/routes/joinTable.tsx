import axios from "axios";
import type { Route } from "../+types/root";
import { Form, redirect, useNavigate } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
    const player_id = params.player_id;

    let username;
    try {
        const res = await axios.get(
            "http://localhost:3000/getPlayer",
            {
                data: { player_id: player_id },
            }
        );
        username = res.data.username;
    } catch(err) {
        throw new Response("Player does not exist", { status: 400 });
    }

    return { player_id, username };
}

export async function action({ request, params }: Route.ActionArgs) {
    const player_id = params.player_id;

    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    const table_id = updates.table_id;
    
    // check if table exists
    try {
        const res = await axios.post(
            "http://localhost:3000/player/joinTable",
            {
                player_id: player_id,
                table_id: table_id,
            }
        );

        if (res.status === 200) {
            return redirect(`/table/${player_id}/${table_id}`);
        } else {
            throw new Response("Table doesn't exist", { status: 400 });
        }
    } catch(err) {
        throw new Response("Page not found", { status: 404 });
    }
}

function JoinTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    // TODO: check if player exists
    return (
        <>
            Hi {loaderData.username}!<br />

            <Form method="put">
                Please enter the table id:<br />
                <input name="table_id" type="text"></input><br />
                <button type="submit">Join</button><br />
            </Form>

            Don't have a table? Create one <button onClick={() => navigate(`/createTable/${loaderData.player_id}`)}>HERE</button><br />
        </>
    );
}

export default JoinTable;
