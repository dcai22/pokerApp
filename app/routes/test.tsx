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

export default function Test() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
        }
    });

    const [value, setValue] = useState(0);
    const [playerId, setPlayerId] = useState("");

    useEffect(() => {
        setPlayerId(sessionStorage.getItem("playerId") ?? "");
        if (sessionStorage.getItem("value")) {
            setValue(parseInt(sessionStorage.getItem("value") as string));
        }
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const newValue = values.amount;
        setValue(newValue);
        sessionStorage.setItem("value", newValue.toString());
    }

    async function update() {
        const newValue =value + 1;
        setValue(newValue);
        sessionStorage.setItem("value", newValue.toString());

        const randomReq = await axios.get('http://localhost:3000/numVotes');
        console.log(randomReq);
    }

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

            <div>{playerId}</div>
        </>
    );
}