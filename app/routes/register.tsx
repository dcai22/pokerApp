import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    // TODO: create database entry and use player_id for routing
    // TODO: has password
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
        throw new Response("user with that name already exists", { status: 400 });
    }
}

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
