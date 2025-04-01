import { Form, redirect } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    // TODO: create database entry and use player_id for routing
    try {
        await axios.post(
            "http://localhost:3000/registerPlayer",
            {
                username: updates.username,
                password: updates.password,
            }
        );
        return redirect(`/joinTable/${updates.username}`);
    } catch(err) {
        throw new Response("Not Found", { status: 404 });
    }
}

export default function Register() {
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
        </>
    );
}
