import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

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
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);

    if (updates.sb > updates.bb) {
        throw new Response("Small Blind cannot be larger than Big Blind", { status: 400 });
    }

    try {
        const res = await axios.post(
            "http://localhost:3000/player/createTable",
            {
                name: updates.name,
                sb: updates.sb,
                bb: updates.bb,
                player_id: params.player_id,
            }
        );

        return redirect(`/table/${params.player_id}/${res.data.table_id}`);
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
            Want to join a table? Click <button onClick={() => navigate(`/joinTable/${loaderData.player_id}`)}>HERE</button><br />
        </>
    );
}
