import { data, Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";
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
    
    let token;
    try {
        const res = await axios.post(
            "http://localhost:3000/login",
            {
                username: updates.username,
                password: updates.password,
            }
        );
        
        if (res.status === 200) {
            token = res.data.token;
        } else {
            session.flash("error", "Invalid username/password");
            return redirect("/login", {
                headers: {
                    "Set-Cookie": await commitSession(session),
                },
            });
        }
    } catch(err) {
        throw new Response("Page not found", { status: 404 });
    }
    
    session.set("userId", token);
    return redirect("/joinTable", {
        headers: {
            "Set-Cookie": await commitSession(session),
        },
    });
}

// TODO: error message from loaderData
export default function Login({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <>
            Log in to your account<br />
            <Form method="post">
                <label htmlFor="username">Username:</label><br />
                <input name="username" id="username" type="text"></input><br />
                <label htmlFor="password">Password:</label><br />
                <input name="password" id="password" type="password"></input><br />
                <button type="submit">LOGIN</button>
            </Form>

            Don't have an account? Register <button onClick={() => navigate("/register")}>HERE</button><br />
        </>
    );
}