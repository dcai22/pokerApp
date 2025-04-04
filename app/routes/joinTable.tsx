import axios from "axios";
import type { Route } from "../+types/root";
import { Form, redirect, useNavigate } from "react-router";
import { commitSession, destroySession, getSession } from "~/sessions.server";
import { authToken } from "server/helpers/auth";

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
        throw new Response("Error in joinTable", { status: 400 });
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

    return { player_id, username };
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
        throw new Response("Error in joinTable", { status: 400 });
    }

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
            return redirect(`/table/${table_id}`, {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        } else {
            throw new Response("Table doesn't exist", { status: 400 });
        }
    } catch(err) {
        throw new Response("Page not found", { status: 404 });
    }
}

// TODO: logout button
function JoinTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <>
            Hi {loaderData.username}!<br />

            <Form method="put">
                Please enter the table id:<br />
                <input name="table_id" type="text"></input><br />
                <button type="submit">Join</button><br />
            </Form>

            Don't have a table? Create one <button onClick={() => navigate(`/createTable`)}>HERE</button><br />
        </>
    );
}

export default JoinTable;
