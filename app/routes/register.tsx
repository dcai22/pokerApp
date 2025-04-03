import { Form, redirect, useNavigate } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";
import { genHash } from "server/helpers/auth";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);

    const hashedPassword = await genHash(updates.password as string);

    try {
        const res = await axios.post(
            "http://localhost:3000/registerPlayer",
            {
                username: updates.username,
                hashedPassword: hashedPassword,
            }
        );
        return redirect(`/joinTable/${res.data.player_id}`);
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
