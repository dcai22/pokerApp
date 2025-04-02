import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

export async function loader({ params }: Route.LoaderArgs) {
    const username = params.username;
    return { username };
}

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    console.log(updates.table_id);

    try {
        await axios.post(
            "http://localhost:3000/player/createTable",
            {
                name: updates.name,
                sb: updates.sb,
                bb: updates.bb,
                username: params.username,
            }
        );

        return redirect(`/table/${params.username}/${updates.name}`);
    } catch(err) {
        throw new Response("Page not found", { status: 404 });
    }
}

export default function CreateTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <>
            Hi {loaderData.username}!<br />
            Create a new table!<br />
            <Form method="post">
                <label htmlFor="name">Table name:</label><br />
                <input name="name" id="name" type="text"></input><br />

                <label htmlFor="sb">Small Blind:</label><br />
                <input name="sb" type="number"></input><br />

                <label htmlFor="bb">Big Blind:</label><br />
                <input name="bb" type="number"></input><br />

                <button type="submit">Create</button><br />
            </Form>
            Want to join a table? Click <button onClick={() => navigate(`/joinTable/${loaderData.username}`)}>HERE</button><br />
        </>
    );
}
