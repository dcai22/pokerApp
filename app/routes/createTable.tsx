import { useNavigate } from "react-router";
import axios from "axios";
import Logout from "~/components/Logout";
import Greeting from "~/components/Greeting";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { authToken } from "~/helpers";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { API_BASE } from "~/root";

const formSchema = z.object({
    tableName: z.string().min(1, { message: "*required field" }),
    sb: z.coerce.number({ message: "invalid: please enter a number" }).multipleOf(0.01, { message: "invalid: please enter to the nearest cent" }),
    bb: z.coerce.number({ message: "invalid: please enter a number" }).multipleOf(0.01, { message: "invalid: please enter to the nearest cent" }),
});

export default function CreateTable() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tableName: "",
            sb: 0.5,
            bb: 1,
        }
    })

    const hasRun = useRef(false);

    const [token, setToken] = useState("");
    const [playerId, setPlayerId] = useState(-1);
    const [username, setUsername] = useState("");

    useEffect(() => {
        async function authAndInit() {
            const res = await authToken();
            if (res.navigate) {
                sessionStorage.removeItem("token");
                sessionStorage.removeItem("playerId");
                navigate("/login");
            } else {
                setToken(res.token as string);
                setPlayerId(res.playerId as number);
                setUsername(res.username);
            }
        }

        if (!hasRun.current) {
            hasRun.current = true;
            authAndInit();
        } else {
            console.log("effect was skipped to prevent double activation");
        }
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const tableName = values.tableName;
        const sb = values.sb;
        const bb = values.bb;

        if (sb > bb) {
            window.alert("small blind cannot be larger than big blind");
            return;
        }
    
        try {
            const res = await axios.post(
                `${API_BASE}/player/createTable`,
                {
                    tableName,
                    sb,
                    bb,
                    playerId,
                }
            );
            navigate(`/table/${res.data.tableId}`);
        } catch(err) {
            window.alert("cannot create table");
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <Greeting name={username} />
                <h1 className="mb-2">Create a new table!</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col mb-10">
                        <FormField
                            control={form.control}
                            name="tableName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel />
                                    <FormControl>
                                        <Input placeholder="Table name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sb"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel />
                                    <FormControl>
                                        <Input placeholder="Small blind" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bb"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel />
                                    <FormControl>
                                        <Input placeholder="Big blind" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="mt-2">Create table</Button>
                    </form>
                </Form>

                <h1 className="mb-2">Already have a table?</h1>
                <Button onClick={() => navigate(`/joinTable`)} className="mb-10">Join an existing table</Button>
                <Logout playerId={playerId} token={token} />
            </div>
        </div>
    );
}
