import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "../+types/root";
import axios from "axios";

export async function clientLoader() {
    return { value: 0 };
}

export default function Test({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    const [value, setValue] = useState(loaderData.value);
    // const [value, setValue] = useState(0);

    useEffect(() => {
        const value = sessionStorage.getItem("value");
        if (value === null) {
            sessionStorage.setItem("value", "0");
        } else {
            setValue(parseInt(value));
        }
    }, []);

    async function update() {
        const value = sessionStorage.getItem("value");
        if (value === null) {
            sessionStorage.setItem("value", "0");
        } else {
            const valueInt = parseInt(value);
            sessionStorage.setItem("value", (valueInt + 1).toString());
        }

        const newValue = sessionStorage.getItem("value") ?? "0";
        setValue(parseInt(newValue));

        const randomReq = await axios.get('http://localhost:3000/numVotes');
        console.log(randomReq);
    }

    return (
        <>
            <Button onClick={() => navigate("/")}>Back</Button>
            <Button onClick={update}>Increase value</Button>
            <div>Value is: {value}</div>
        </>
    );
}