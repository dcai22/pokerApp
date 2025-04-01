import { Form, redirect } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

export async function action({ request }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    const username = updates.username;
    console.log(username);
    // TODO: create database entry and use player_id for routing
    return redirect(`/joinTable/${username}`);
}

export default function Register() {
    return (
        <>
            <div>
                Please enter your name:
            </div>
            <Form method="post">
                <div>
                    <input name="username" type="text"></input>
                </div>
                <button type="submit">
                    SUBMIT
                </button>
            </Form>
        </>
    );
}
