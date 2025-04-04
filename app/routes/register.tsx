import { data, Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";
import { genHash } from "server/helpers/auth";
import { commitSession, getSession } from "~/sessions.server";

export async function loader({ request }: Route.LoaderArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (session.has("userId")) {
        return redirect("/joinTable");
    }

    return data(
        { error: session.get("error") },
        {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        }
    );
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get("Cookie"));

    const formData = await request.formData();
    const updates = Object.fromEntries(formData);

    const hashedPassword = await genHash(updates.password as string);

    let token;
    try {
        const res = await axios.post(
            "http://localhost:3000/registerPlayer",
            {
                username: updates.username,
                hashedPassword: hashedPassword,
            }
        );
        if (res.status === 200) {
            token = res.data.token;
        } else {
            session.flash("error", "Player with that username already exists");
            return redirect("/register", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }
    } catch(err) {
        throw new Response("user with that name already exists", { status: 400 });
    }

    session.set("userId", token);
    return redirect("/joinTable", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

// TODO: error message from loaderData
export default function Register() {
    const navigate = useNavigate();

    return (
        <>
            Register a new account<br />
            <Form method="post">
                <label htmlFor="username">Username:</label><br />
                <input name="username" id="username" type="text"></input><br />

                <label htmlFor="password">Password:</label><br />
                <input name="password" id="password" type="password"></input><br />

                <button type="submit">Submit</button>
            </Form>
            Already have an account? Login <button onClick={() => navigate("/login")}>HERE</button><br />
        </>
    );
}
