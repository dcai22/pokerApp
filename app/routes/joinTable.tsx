import axios from "axios";
import { useNavigate } from "react-router";
import Logout from "~/components/Logout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import Greeting from "~/components/Greeting";
import { useEffect, useRef, useState } from "react";
import { authToken } from "~/helpers";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";

const formSchema = z.object({
    tableId: z.string(),
})

function JoinTable() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tableId: "",
        }
    });

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
        const tableId = parseInt(values.tableId);
        if (!tableId) {
            window.alert("Invalid Table ID");
            return;
        }

        try {
            const res = await axios.post(
                "http://localhost:3000/player/joinTable",
                {
                    playerId,
                    tableId,
                }
            );

            if (res.status === 200) {
                navigate(`/table/${tableId}`);
            } else {
                window.alert("table does not exist");
            }
        } catch(err) {
            window.alert("table does not exist");
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <Greeting name={username} />
                <h1>Join a table:</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col mb-10">
                        <FormField 
                            control={form.control}
                            name="tableId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel />
                                    <FormControl>
                                        <Input placeholder="Table ID" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="mt-2">Join table</Button>
                    </form>
                </Form>

                <h1 className="mb-1">Don't have a table?</h1>
                <Button onClick={() => navigate(`/createTable`)} className="mb-10">Create a new table</Button>
                <Logout player_id={playerId} token={token} />
            </div>
        </div>
    );
}

export default JoinTable;
