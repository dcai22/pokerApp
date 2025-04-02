import axios from "axios";
import type { Route } from "../+types/root";
import { Form, redirect, useNavigate } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
    // TODO: use player_id for routing
    const username = params.username;
    console.log(username);
    return { username };
}

export async function action({ request, params }: Route.ActionArgs) {
    const username = params.username;

    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    const table_name = updates.table_name;
    // TODO: check if table exists
    try {
        const res = await axios.post(
            "http://localhost:3000/player/joinTable",
            {
                username: username,
                table_name: table_name,
            }
        );

        if (res.status === 200) {
            return redirect(`/table/${username}/${table_name}`);
        } else {
            throw new Response("Table doesn't exist", { status: 400 });
        }
    } catch(err) {
        throw new Response("Page not found", { status: 404 });
    }
}

// TODO: use table_id instead of table_name
function JoinTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    // TODO: check if player exists

    return (
        <>
            Hi {loaderData.username}!<br />

            <Form method="put">
                Please enter your table name:<br />
                <input name="table_name" type="text"></input><br />
                <button type="submit">Join</button><br />
            </Form>

            Don't have a table? Create one <button onClick={() => navigate(`/createTable/${loaderData.username}`)}>HERE</button><br />
        </>
    );
}

export default JoinTable;
