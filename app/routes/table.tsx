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
import { Form, FormControl, FormField, FormItem, FormLabel } from "~/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, Hand, type Buyin } from "server/interface";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import RankSelect from "~/components/RankSelect";
import SuitSelect from "~/components/SuitSelect";

const buyinFormSchema = z.object({
    amount: z.coerce.number({ message: "invalid: please enter a number" }).multipleOf(0.01, { message: "invalid: please enter to the nearest cent" }),
});

const vpipFormSchema = z.object({
    option: z.enum(["yes", "no"], {
        required_error: "Select one of the options",
    }),
});

const handFormSchema = z.object({
    rank1: z.enum(["", ...Card.ranks]),
    suit1: z.enum(["", ...Card.suits]),
    rank2: z.enum(["", ...Card.ranks]),
    suit2: z.enum(["", ...Card.suits]),
});

// TODO: remove table_players entry from database upon leaving page
export default function Table() {
    const navigate = useNavigate();
    const buyinForm = useForm<z.infer<typeof buyinFormSchema>>({
        resolver: zodResolver(buyinFormSchema),
        defaultValues: {
            amount: 25,
        },
    });
    const vpipForm = useForm<z.infer<typeof vpipFormSchema>>({
        resolver: zodResolver(vpipFormSchema),
        defaultValues: {
            option: "no",
        },
    });
    const handForm = useForm<z.infer<typeof handFormSchema>>({
        resolver: zodResolver(handFormSchema),
        defaultValues: {
            rank1: "",
            suit1: "",
            rank2: "",
            suit2: "",
        },
    });

    const hasRun = useRef(false);

    const tableId = useParams().tableId as string;
    const [playerId, setPlayerId] = useState(-1);
    const [username, setUsername] = useState("");
    const [tableName, setTableName] = useState("");
    const [players, setPlayers] = useState(new Array());
    const [ownerName, setOwnerName] = useState("");
    const [hasStarted, setHasStarted] = useState(false);    // TODO: initiate properly
    const [buyinAlert, setBuyinAlert] = useState(<></>);
    const [lastBuyinTime, setLastBuyinTime] = useState(null as (string | null));
    const [buyinHistory, setBuyinHistory] = useState([] as Buyin[]);
    const [handNumber, setHandNumber] = useState(1);
    const [hasEnteredHand, setHasEnteredHand] = useState(false);
    const [hasVpip, setHasVpip] = useState(false);
    const [vpipOption, setVpipOption] = useState("no");
    const [curHand, setCurHand] = useState(new Hand(null, null));
    
    socket.on("updatePlayers", async (updatedPlayers) => {
        setPlayers(updatedPlayers);
        console.log(updatedPlayers);
        await updateBuyinHistory();
    });

    socket.on("startGame", () => {
        setHasStarted(true);
        setHasEnteredHand(false);
        setHasVpip(false);
    });

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
                    setHandNumber(tableRes.data.num_hands + 1);
                } else {
                    navigate("/joinTable");
                }
            } catch (err) {
                navigate("/joinTable");
            }

            socket.emit("joinTable", tableId);
            await updateBuyinHistory();
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

    async function onBuyin(values: z.infer<typeof buyinFormSchema>) {
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

    async function updateBuyinHistory() {
        try {
            const res = await axios.get(`http://localhost:3000/player/getBuyins?playerId=${playerId}&tableId=${tableId}`);
            if (res.status === 200) {
                setBuyinHistory(res.data.buyins);
            } else {
                console.log("Error fetching buyin history");
            }
        } catch (err) {
            console.log("Error fetching buyin history");
        }
    }

    function getBuyinHistoryComponent() {
        return (
            <ul className="divide-y divide-gray-500">
                {buyinHistory.map((e, i) => <li key={i} className="py-2">
                    <ul>
                        <li key="amount" className="flex"><span className="w-26">Amount:</span>${e.amount}</li>
                        <li key="time" className="flex"><span className="w-26">Timestamp:</span>{
                            (new Date(e.time)).toLocaleString("en-GB", {
                                dateStyle: "long",
                                timeStyle: "short",
                                timeZone: "Australia/Sydney",
                            })
                        }</li>
                    </ul>
                </li>)}
            </ul>
        );
    }

    function onVpip(data: z.infer<typeof vpipFormSchema>) {
        setVpipOption(data.option);
        setHasVpip(true);
        console.log("hi from onVpip");
    }

    function onEnterHand(data: z.infer<typeof handFormSchema>) {
        const rank1 = data.rank1;
        const suit1 = data.suit1;
        const rank2 = data.rank2;
        const suit2 = data.suit2;

        if ([rank1, suit1, rank2, suit2].includes("")) {
            console.log("Error selecting hand");
            setCurHand(new Hand(null, null));
        } else {
            console.log("Hand successfully set!");
            const newHand = new Hand(new Card(rank1, suit1), new Card(rank2, suit2));
            setCurHand(newHand);
        }
        setHasEnteredHand(true);
    }

    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", handleLeave);

    return (
        <div className="flex">
            <div className="flex flex-col justify-center w-50 mx-5">
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
            <div className="h-screen w-screen">
                {hasStarted
                    ? <div className="flex w-full h-full mx-5">
                        <div className="flex justify-center flex-col mt-10 w-50">
                            <Buyins players={players} username={username} />
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="my-2">Buyin</Button>
                                </DialogTrigger>
                                <Form {...buyinForm}>
                                    <DialogContent className="w-1/5">
                                        <form onSubmit={buyinForm.handleSubmit(onBuyin)} className="flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Buyin
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Enter an amount to buyin:
                                                </DialogDescription>
                                            </DialogHeader>
                                            <FormField
                                                control={buyinForm.control}
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
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>Buyin history</Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-7/8 overflow-auto">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Buyin History
                                        </DialogTitle>
                                        <DialogDescription />
                                    </DialogHeader>
                                    {getBuyinHistoryComponent()}
                                    <DialogFooter className="mt-1">
                                        <DialogClose asChild>
                                            <Button type="button">Close</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="flex flex-col w-full">
                            <div className="flex justify-center w-full h-20 text-7xl">
                                Hand {handNumber}
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="my-2" disabled={hasEnteredHand}>Enter hand (optional)</Button>
                                </DialogTrigger>
                                <Form {...handForm}>
                                    <DialogContent className="w-400">
                                        <form onSubmit={handForm.handleSubmit(onEnterHand)} className="flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Enter Hand
                                                </DialogTitle>
                                                <DialogDescription />
                                            </DialogHeader>
                                            <div className="flex w-full h-full">
                                                <div className="flex flex-col w-full">
                                                    <FormLabel className="my-4">
                                                        Card 1: rank
                                                    </FormLabel>
                                                    <FormField
                                                        control={handForm.control}
                                                        name="rank1"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <RankSelect onValueChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <FormLabel className="my-4">
                                                        Card 1: suit
                                                    </FormLabel>
                                                    <FormField
                                                        control={handForm.control}
                                                        name="suit1"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <SuitSelect onValueChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <FormLabel className="my-4">
                                                        Card 2: rank
                                                    </FormLabel>
                                                    <FormField
                                                        control={handForm.control}
                                                        name="rank2"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <RankSelect onValueChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                                <div className="flex flex-col w-full">
                                                    <FormLabel className="my-4">
                                                        Card 2: suit
                                                    </FormLabel>
                                                    <FormField
                                                        control={handForm.control}
                                                        name="suit2"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <SuitSelect onValueChange={field.onChange} />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter className="mt-1">
                                                <DialogClose asChild>
                                                    <Button type="submit">Confirm</Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Form>
                            </Dialog>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="my-2" disabled={hasVpip}>VPIP</Button>
                                </DialogTrigger>
                                <Form {...vpipForm}>
                                    <DialogContent className="w-1/5">
                                        <form onSubmit={vpipForm.handleSubmit(onVpip)} className="flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    VPIP
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Select an option:
                                                </DialogDescription>
                                            </DialogHeader>
                                            <FormField
                                                control={vpipForm.control}
                                                name="option"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue="no"
                                                                className="flex flex-col space-y-1"
                                                            >
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                    <RadioGroupItem value="no" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">
                                                                    No
                                                                    </FormLabel>
                                                                </FormItem>
                                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                                    <FormControl>
                                                                    <RadioGroupItem value="yes" />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">
                                                                    Yes
                                                                    </FormLabel>
                                                                </FormItem>
                                                            </RadioGroup>
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
                            <Button>
                                Next Hand
                            </Button>
                        </div>
                    </div>
                    : <div className="flex w-full h-full justify-center items-center">{isOwner() ? <Button className="h-20 w-40 text-xl" onClick={handleStart}>Start game</Button> : <div className="text-xl text-center">Waiting for owner to start game...</div>}</div>
                }
            </div>
            {buyinAlert}
        </div>
    );
}
