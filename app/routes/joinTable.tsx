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
    const table_id = updates.table_id;
    console.log(table_id);
    // TODO: check if table exists
    return redirect(`/table/${username}/${table_id}`);
}

function JoinTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    // TODO: check if player exists

    return (
        <>
            <p>Hi {loaderData.username}!</p>

            <Form method="put">
                <p>Please entire the table code:</p>
                <p><input name="table_id" type="text"></input></p>
                <button type="submit">JOIN TABLE</button>
            </Form>

            <button onClick={() => navigate(`/createTable/${loaderData.username}`)}>CREATE A NEW TABLE</button>
        </>
    );
}

export default JoinTable;
