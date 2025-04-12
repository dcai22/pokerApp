import axios from "axios";
import { useNavigate, useParams } from "react-router";
import Greeting from "~/components/Greeting";
import { Button } from "~/components/ui/button";
import TableWelcome from "~/components/TableWelcome";
import { useEffect, useRef, useState } from "react";
import { authToken, calcPosition } from "~/helpers";
import { socket } from "~/root";
import Buyins from "~/components/Buyins";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "~/components/ui/dialog"
import { Input } from "~/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

const formSchema = z.object({
    amount: z.coerce.number({ message: "invalid: please enter a number" }).multipleOf(0.01, { message: "invalid: please enter to the nearest cent" }),
});

// TODO: remove table_players entry from database upon leaving page
export default function Table() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 25,
        },
    });

    const hasRun = useRef(false);

    const tableId = useParams().tableId as string;
    const [playerId, setPlayerId] = useState(-1);
    const [username, setUsername] = useState("");
    const [tableName, setTableName] = useState("");
    const [players, setPlayers] = useState(new Array());
    const [ownerName, setOwnerName] = useState("");
    const [hasStarted, setHasStarted] = useState(false);
    const [buyinAlert, setBuyinAlert] = useState(<></>);
    const [lastBuyinTime, setLastBuyinTime] = useState(null as (string | null));
    
    socket.on("updatePlayers", (updatedPlayers) => {
        setPlayers(updatedPlayers);
        console.log(updatedPlayers);
    });

    socket.on("startGame", () => {
        setHasStarted(true);
    })

    socket.on("removeBuyinAlert", (buyinTime) => {
        if (lastBuyinTime === buyinTime) setBuyinAlert(<></>);
        console.log(lastBuyinTime);
        console.log(buyinTime);
    });
    
    useEffect(() => {
        async function authAndInit() {
            let newPlayerId;
            let newUsername;
            
            const res = await authToken();
            if (res.navigate) {
                navigate("/login");
            } else {
                newPlayerId = res.playerId as number;
                newUsername = res.username;
                setPlayerId(newPlayerId);
                setUsername(newUsername);
            }

            socket.connect();
            console.log(`${newUsername} has connected in table!`);

            try {
                const tableRes = await axios.get(
                    `http://localhost:3000/getTable?table_id=${tableId}`
                );
                if (tableRes.status === 200) {
                    const ownerRes = await axios.get(
                        `http://localhost:3000/getPlayer?player_id=${tableRes.data.owner}`
                    );
                    if (ownerRes.status === 200) {
                        setOwnerName(ownerRes.data.username);
                    }

                    setTableName(tableRes.data.name);
                } else {
                    navigate("/joinTable");
                }
            } catch (err) {
                navigate("/joinTable");
            }

            socket.emit("joinTable", tableId);
        }

        if (!hasRun.current) {
            hasRun.current = true;
            authAndInit();
        } else {
            console.log("effect was skipped to prevent double activation");
        }
    }, []);

    async function handleLeave() {
        try {
            await axios.delete(
                "http://localhost:3000/player/leaveTable",
                {
                    data: {
                        player_id: playerId,
                        table_id: tableId,
                    },
                }
            );

            navigate(`/joinTable`);
        } catch(err) {
            alert("error while leaving table");
        }
    }

    function isOwner() {
        return ownerName !== "" && ownerName === username;
    }

    function handleStart() {
        if (players.length < 2) {
            window.alert("Not enough players to start");
            return;
        }

        socket.emit("startGame", tableId);
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const amount = values.amount;
        const newBuyinAlert = (
            <Alert className="fixed bottom-4 right-4 z-50 w-50" onClick={() => setBuyinAlert(<></>)}>
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
                <div><span className="font-bold">{username}</span> bought in for ${amount}</div>
            </AlertDescription>
            </Alert>
        );
        setBuyinAlert(newBuyinAlert);

        const buyinTime = (new Date()).toISOString();
        setLastBuyinTime(buyinTime);

        try {
            const res = await axios.post(
                "http://localhost:3000/player/buyin",
                {
                    amount,
                    buyinTime,
                    tableId,
                    playerId,
                }
            );

            if (res.status !== 200) {
                window.alert("Error: couldn't buy in");
                return;
            }
        } catch (err) {
            window.alert("Error: couldn't buy in");
            return;
        }

        socket.emit("newBuyin", buyinTime, tableId, playerId);
    }

    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", handleLeave);

    return (
        <div className="flex">
            <div className="flex flex-col justify-center w-50 ml-10 mt-10">
                <Greeting name={username} />
                <TableWelcome name={tableName} code={parseInt(tableId)} />

                Starting positions:
                <div className="mb-10">
                    <ol>
                        {/* TODO: change key to NOT use {i} as it is unsafe */}
                        {players.map((e, i) => 
                            <li key={i} className="flex">
                                <span className="w-7">{e.name === ownerName ? "⭐" : ""}</span>
                                <span className="font-bold w-15">{calcPosition(i, players.length)}</span>
                                {e.name}
                            </li>
                        )}
                    </ol>
                </div>

                <Button onClick={handleLeave}>Leave table</Button>
            </div>
            <div className="flex w-screen justify-center h-screen">
                {hasStarted
                    ? <div className="flex flex-col">
                        <Buyins players={players} username={username} />
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button>Buyin</Button>
                            </DialogTrigger>
                            <Form {...form}>
                                <DialogContent className="w-1/5">
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Buyin
                                            </DialogTitle>
                                            <DialogDescription>
                                                Enter an amount to buyin:
                                            </DialogDescription>
                                        </DialogHeader>
                                        <FormField
                                            control={form.control}
                                            name="amount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input placeholder="e.g. 25" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter className="mt-1">
                                            <DialogClose asChild>
                                                <Button type="submit">Confirm</Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Form>
                        </Dialog>
                    </div>
                    : <div className="flex items-center">{isOwner() ? <Button className="h-20 w-40 text-xl" onClick={handleStart}>Start game</Button> : <div className="text-xl text-center">Waiting for owner to start game...</div>}</div>
                    // : <div className="flex items-center"><Button className="h-20 w-40 text-xl" onClick={handleStart} disabled={!isOwner()}>Start game</Button></div>
                }
                {buyinAlert}
            </div>
        </div>
    );
}
