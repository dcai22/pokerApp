import { Form } from "react-router";
import type { Route } from "../+types/root";
import axios from "axios";

export async function action({ request, params }: Route.ActionArgs) {
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    console.log(updates.username);
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
