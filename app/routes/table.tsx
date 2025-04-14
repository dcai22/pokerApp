import axios from "axios";
import { useNavigate, useParams } from "react-router";
import Greeting from "~/components/Greeting";
import { Button } from "~/components/ui/button";
import TableWelcome from "~/components/TableWelcome";
import { useEffect, useRef, useState, type SetStateAction } from "react";
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
    const [handNum, setHandNum] = useState(1);
    const [hasEnteredHand, setHasEnteredHand] = useState(false);
    const [hasVpip, setHasVpip] = useState(false);
    const [curHand, setCurHand] = useState(new Hand(null, null));
    const [isHandDone, setIsHandDone] = useState(false);
    const [rank1Randomiser, setRank1Randomiser] = useState(Array.from({ length: 13 }, () => Math.random()));
    const [suit1Randomiser, setSuit1Randomiser] = useState(Array.from({ length: 4 }, () => Math.random()));
    const [rank2Randomiser, setRank2Randomiser] = useState(Array.from({ length: 13 }, () => Math.random()));
    const [suit2Randomiser, setSuit2Randomiser] = useState(Array.from({ length: 4 }, () => Math.random()));
    const [isActive, setIsActive] = useState(false);
    
    async function socketHandleUpdatePlayers(updatedPlayers: SetStateAction<any[]>) {
        setPlayers(updatedPlayers);
        console.log(updatedPlayers);
        await updateBuyinHistory();
    }

    function socketHandleStartGame() {
        setHasStarted(true);
        setHasEnteredHand(false);
        setHasVpip(false);
    }

    function socketHandleRemoveBuyinAlert(buyinTime: string | null) {
        if (lastBuyinTime === buyinTime) setBuyinAlert(<></>);
        console.log(lastBuyinTime);
        console.log(buyinTime);
    }

    function socketHandleHandDone() {   
        setIsHandDone(true);
    }

    function socketHandleNextHand(newHandNum: SetStateAction<number>) {
        setHandNum(newHandNum);
    }

    useEffect(() => {
        async function authAndInit() {
            // authenticate, then set playerId and username
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

            // connect socket
            socket.connect();
            console.log(`${newUsername} has connected in table!`);

            try {
                // check table exists
                const tableRes = await axios.get(
                    `http://localhost:3000/getTable?table_id=${tableId}`
                );
                if (tableRes.status === 200) {
                    // check if player is owner
                    const ownerRes = await axios.get(
                        `http://localhost:3000/getPlayer?player_id=${tableRes.data.owner}`
                    );
                    if (ownerRes.status === 200) {
                        setOwnerName(ownerRes.data.username);
                    }

                    // set default values
                    setTableName(tableRes.data.name);
                    setHandNum(tableRes.data.num_hands + 1);
                    setHasStarted(tableRes.data.has_started);
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

        socket.on("updatePlayers", socketHandleUpdatePlayers);
        socket.on("startGame", socketHandleStartGame);
        socket.on("removeBuyinAlert", socketHandleRemoveBuyinAlert);
        socket.on("handDone", socketHandleHandDone);
        socket.on("nextHand", socketHandleNextHand);

        return () => {
            socket.off("updatePlayers", socketHandleUpdatePlayers);
            socket.off("startGame", socketHandleStartGame);
            socket.off("removeBuyinAlert", socketHandleRemoveBuyinAlert);
            socket.off("handDone", socketHandleHandDone);
            socket.off("nextHand", socketHandleNextHand);
        }
    }, []);

    // Reset values for new hand
    useEffect(() => {
        setHasEnteredHand(false);
        setHasVpip(false);
        setCurHand(new Hand(null, null));
        setIsHandDone(false);
        setRank1Randomiser(Array.from({ length: 13 }, () => Math.random()));
        setSuit1Randomiser(Array.from({ length: 4 }, () => Math.random()));
        setRank2Randomiser(Array.from({ length: 13 }, () => Math.random()));
        setSuit2Randomiser(Array.from({ length: 4 }, () => Math.random()));
    }, [handNum]);

    useEffect(() => {
        const player = players.find((e) => e.name === username);
        if (player) {
            setIsActive(player.isActive);
        }
    }, [players]);

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

    async function onVpip(data: z.infer<typeof vpipFormSchema>) {
        const option = data.option
        
        try {
            const res = await axios.post(
                "http://localhost:3000/player/vpip",
                {
                    playerId,
                    tableId,
                    handNum,
                    handCid: curHand.cid(),
                    vpip: option,
                }
            );
            if (res.status === 200) {
                setHasVpip(true);
                socket.emit("vpip", tableId, handNum);
            } else {
                console.log(res.data.err);
            }
        } catch (err) {
            console.log(err);
        }
    }

    async function onEnterHand(data: z.infer<typeof handFormSchema>) {
        const rank1 = data.rank1;
        const suit1 = data.suit1;
        const rank2 = data.rank2;
        const suit2 = data.suit2;

        const newHand = [rank1, suit1, rank2, suit2].includes("")
            ? new Hand(null, null)
            : new Hand(new Card(rank1, suit1), new Card(rank2, suit2));
        if (rank1 === rank2 && suit1 === suit2) {
            console.log("Error: Cards can't be the same. Please try again.");
            return;
        }
        if (!hasVpip) {
            setCurHand(newHand);
            setHasEnteredHand(true);
            console.log("Hand successfully set!");
            return;
        }
        try {
            console.log(playerId);
            console.log(tableId);
            console.log(handNum);
            console.log(newHand.cid());
            const res = await axios.put(
                "http://localhost:3000/player/addHand",
                {
                    playerId,
                    tableId,
                    handNum,
                    handCid: newHand.cid(),
                }
            );
            if (res.status === 200) {
                setCurHand(newHand);
                setHasEnteredHand(true);
                console.log("Hand successfully set!");
            } else {
                console.log(res.data.err);
            }
        } catch (err) {
            console.log(err);
        }
    }

    function handleNext() {
        socket.emit("alertNextHand", tableId, handNum);
    }
    
    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", handleLeave);
    
    return (
        <div className="flex justify-center items-center h-screen w-screen">
            <div className="flex h-9/10 w-9/10">
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
                                    <span className={`w-15 ${e.isActive ? "font-bold" : "text-gray-500"}`}>{calcPosition(i, players.length)}</span>
                                    {e.name}
                                </li>
                            )}
                        </ol>
                    </div>

                    <Button onClick={handleLeave}>Leave table</Button>
                </div>
                <div className="w-full h-full">
                    {hasStarted
                        ? <div className="flex w-full h-full mx-5">
                            <div className="flex justify-center flex-col w-50 mx-5">
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
                            <div className="flex flex-col w-full mx-5">
                                <div className="flex justify-center w-full h-20 text-7xl">
                                    Hand {handNum}
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="my-2" disabled={hasEnteredHand || !isActive}>Enter hand (optional)</Button>
                                    </DialogTrigger>
                                    <Form {...handForm}>
                                        <DialogContent className="w-400">
                                            <form onSubmit={handForm.handleSubmit(onEnterHand)} className="flex flex-col">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Enter Hand
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Fields are randomised every hand to prevent cheating
                                                    </DialogDescription>
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
                                                                        <RankSelect onValueChange={field.onChange} randomiser={rank1Randomiser} />
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
                                                                        <SuitSelect onValueChange={field.onChange} randomiser={suit1Randomiser} />
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
                                                                        <RankSelect onValueChange={field.onChange} randomiser={rank2Randomiser} />
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
                                                                        <SuitSelect onValueChange={field.onChange} randomiser={suit2Randomiser} />
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
                                        <Button className="my-2" disabled={hasVpip || !isActive}>VPIP</Button>
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
                                <Button onClick={() => socket.emit("changeStatus", tableId, playerId)}>
                                    {isActive ? "Sit out" : "Deal me in"}
                                </Button>
                                {isOwner()
                                    ? <Button disabled={!isHandDone} onClick={handleNext}>
                                        Next Hand
                                    </Button>
                                    : <></>
                                }
                            </div>
                        </div>
                        : <div className="flex w-full h-full justify-center items-center">
                            {isOwner() 
                                ? <Button className="h-20 w-40 text-xl" onClick={handleStart}>
                                    Start game
                                </Button>
                                : <div className="text-xl text-center">
                                    Waiting for owner to start game...
                                </div>
                            }
                        </div>
                    }
                </div>
                {buyinAlert}
            </div>
        </div>
    );
}
