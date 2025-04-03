import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);

    try {
        const res = await axios.post(
            "http://localhost:3000/login",
            {
                username: updates.username,
                password: updates.password,
            }
        );

        if (res.status === 200) {
            return redirect(`/joinTable/${res.data.player_id}`);
        } else {
            throw new Response("username or password incorrect", { status: 400 });
        }
    } catch(err) {
        throw new Response("Page not found", { status: 404 });
    }
}

export default function Login() {
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