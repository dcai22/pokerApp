import { data, Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";
import { commitSession, getSession } from "~/sessions.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

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
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col justify-center">
                <h1 className="mb-2">Log in to your account:</h1>
                <Form className="flex flex-col" method="post">
                    <Input placeholder="Username" name="username" type="text" className="mb-2"></Input>
                    <Input placeholder="Password" name="password" type="password" className="mb-2"></Input>
                    <Button type="submit" className="mb-10">Login</Button>
                </Form>

                <h1 className="mb-1">Don't have an account?</h1>
                <Button onClick={() => navigate("/register")}>Register an account</Button>
            </div>
        </div>
    );
}