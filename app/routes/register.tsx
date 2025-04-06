import { data, Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";
import { genHash } from "server/helpers/auth";
import { commitSession, getSession } from "~/sessions.server";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

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
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col justify-center">
                <h1 className="mb-2">Register a PokerApp account:</h1>
                <Form className="flex flex-col" method="post">
                    <Input placeholder="Username" name="username" type="text" className="mb-2"></Input>
                    <Input placeholder="Password" name="password" type="password" className="mb-2"></Input>
                    <Button type="submit" className="mb-10">Register</Button>
                </Form>
                <h1 className="mb-1">Already have an account?</h1>
                <Button onClick={() => navigate("/login")}>Login here</Button>
            </div>
        </div>
    );
}
