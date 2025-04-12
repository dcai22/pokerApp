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
    FormField,
    FormItem,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
 
const formSchema = z.object({
  amount: z.coerce.number({ message: "please enter a number "}).int().gte(0, { message: "please enter an amount greater than 0" }),
});

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
        return <div>Hi</div>;
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

    const p = sessionStorage.getItem("playerId");

    return (
        <>
            <Button onClick={() => navigate("/")}>Back</Button>
            <Button onClick={update}>Increase value</Button>
            <div>Value is: {value}</div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button>Set Value</Button>
                </DialogTrigger>
                <Form {...form}>
                    <DialogContent>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="mb-2">Set amount</DialogTitle>
                                <DialogDescription>Enter amount</DialogDescription>
                            </DialogHeader>
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="amount" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="mt-2">
                                <DialogClose asChild>
                                    <Button type="submit">Submit</Button>
                                </DialogClose>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Form>
            </Dialog>

            <div>{p as (number | null)}</div>
        </>
    );
}