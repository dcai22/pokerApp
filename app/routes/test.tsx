import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "../+types/root";

export async function clientLoader() {
    return { value: 0 };
}

export default function Test({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();

    const [value, setValue] = useState(loaderData.value);

    useEffect(() => {
        const value = sessionStorage.getItem("value");
        if (value === null) {
            sessionStorage.setItem("value", "0");
        } else {
            setValue(parseInt(value));
        }
    }, []);

    function update() {
        const value = sessionStorage.getItem("value");
        if (value === null) {
            sessionStorage.setItem("value", "0");
        } else {
            const valueInt = parseInt(value);
            sessionStorage.setItem("value", (valueInt + 1).toString());
        }
        
        
        const newValue = sessionStorage.getItem("value") ?? "0";
        setValue(parseInt(newValue));
    }

    return (
        <>
            <Button onClick={() => navigate("/")}>Back</Button>
            <Button onClick={update}>Increase value</Button>
            <div>Value is: {value}</div>
        </>
    );
}