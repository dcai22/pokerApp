import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";

export async function loader({ params }: Route.LoaderArgs) {
    const username = params.username;
    return { username };
}

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    console.log(updates.table_id);
    // TODO: check if table already exists
    return redirect(`/table/${params.username}/${updates.table_id}`);
}

export default function CreateTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <>
            <p>Hi {loaderData.username}!</p>
            <p>Please enter your new table id:</p>
            <Form method="post">
                <p><input name="table_id" type="text"></input></p>
                <button type="submit">CREATE TABLE</button>
            </Form>
            <p><button onClick={() => navigate(`/joinTable/${loaderData.username}`)}>JOIN AN EXISTING TABLE</button></p>
        </>
    );
}
