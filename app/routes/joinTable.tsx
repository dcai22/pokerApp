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
import { API_BASE } from "~/root";
import DeleteAccountButton from "~/components/DeleteAccountButton";
import { Spinner } from "~/components/ui/spinner";

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

    const [loadingText, setLoadingText] = useState("Loading...");
    const [deletingAccount, setDeletingAccount] = useState(false);

    const [token, setToken] = useState("");
    const [playerId, setPlayerId] = useState(-1);
    const [username, setUsername] = useState("");

    useEffect(() => {
        async function authAndInit() {
            const res = await authToken();
            if (res.navigate) {
                localStorage.removeItem("token");
                localStorage.removeItem("playerId");
                navigate("/login");
            } else {
                setToken(res.token as string);
                setPlayerId(res.playerId as number);
                setUsername(res.username);
            }
            setLoadingText("");
        }

        if (!hasRun.current) {
            hasRun.current = true;
            authAndInit();
        } else {
            console.log("effect was skipped to prevent double activation");
        }
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoadingText("Joining table...");

        const tableId = parseInt(values.tableId);
        if (!tableId) {
            setLoadingText("");
            window.alert("Invalid Table ID");
            return;
        }

        try {
            const res = await axios.post(
                `${API_BASE}/player/joinTable`,
                {
                    playerId,
                    tableId,
                }
            );

            if (res.status === 200) {
                navigate(`/table/${tableId}`);
            } else {
                setLoadingText("");
                window.alert("table does not exist");
            }
        } catch(err) {
            setLoadingText("");
            window.alert("table does not exist");
        }
    }

    if (deletingAccount) return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <Spinner size="large" className="text-red-400">Deleting account...</Spinner>
        </div>
    );

    if (loadingText.length > 0) return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <Spinner size="large">{loadingText}</Spinner>
        </div>
    );

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <DeleteAccountButton playerId={playerId} onSubmit={() => setDeletingAccount(true)} />
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
                <div className="flex flex-col w-full h-full" onClick={() => setLoadingText("Logging out...")}>
                    <Logout playerId={playerId} token={token} />
                </div>
            </div>
        </div>
    );
}

export default JoinTable;
