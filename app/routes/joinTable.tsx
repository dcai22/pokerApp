import axios from "axios";
import type { Route } from "../+types/root";
import { Form, redirect, useNavigate } from "react-router";
import { commitSession, destroySession, getSession } from "~/sessions.server";
import { authToken } from "server/helpers/auth";
import Logout from "~/components/Logout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import Greeting from "~/components/Greeting";

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

function JoinTable({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <Greeting name={loaderData.username} />
                <h1 className="mb-2">Join a table:</h1>
                <Form className="flex flex-col" method="put">
                    <Input placeholder="Table ID" name="table_id" type="text" className="mb-2"></Input>
                    <Button type="submit" className="mb-10">Join table</Button>
                </Form>

                <h1 className="mb-2">Don't have a table?</h1>
                <Button onClick={() => navigate(`/createTable`)} className="mb-10">Create a new table</Button>
                <Logout player_id={loaderData.player_id} token={loaderData.token} />
            </div>
        </div>
    );
}

export default JoinTable;
