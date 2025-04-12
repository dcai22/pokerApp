import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import type { Route } from "../+types/root";
import axios from "axios";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
 
const formSchema = z.object({
  amount: z.number().int().gt(0),
})

export async function clientLoader() {
    return { value: 0 };
}

export default function Test({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
        }
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        setValue(values.amount.toString());
    }

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
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-50">
                    <FormField 
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="amount" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                </FormControl>
                                <FormDescription>
                                    Enter a positive integer
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Submit</Button>
                </form>
            </Form>
        </>
    );
}