import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";
import { commitSession, destroySession, getSession } from "~/sessions.server";
import { authToken } from "server/helpers/auth";
import Logout from "~/components/Logout";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (!session.has("userId")) {
        return redirect("/login");
    }
    const token = session.get("userId");
    let player_id;
    try {
        player_id = await authToken(token as string);
    } catch(err) {
        throw new Response("Error in createTable", { status: 400 });
    }

    if (!player_id) {
        return redirect("/login", {
            headers: {
                "Set-Cookie": await destroySession(session),
            },
        });
    }

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

    return { player_id, username, token };
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (!session.has("userId")) {
        return redirect("/login");
    }
    const token = session.get("userId");
    let player_id;
    try {
        player_id = await authToken(token as string);
    } catch(err) {
        throw new Response("Error in createTable", { status: 400 });
    }

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
                player_id: player_id,
            }
        );

        return redirect(`/table/${res.data.table_id}`, {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
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
            Want to join a table? Click <button onClick={() => navigate(`/joinTable`)}>HERE</button><br />
            <Logout player_id={loaderData.player_id} token={loaderData.token} /><br />
        </>
    );
}
