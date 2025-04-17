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
    const [hasStarted, setHasStarted] = useState(false);
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

    function socketHandleUpdateHandDone(newIsHandDone: boolean | ((prevState: boolean) => boolean)) {
        setIsHandDone(newIsHandDone);
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
            socket.emit("connectToTable", tableId, newPlayerId);

            try {
                // check player is on table (implicitly checks player and table exist)
                const tablePlayerRes = await axios.get(
                    `http://localhost:3000/getTablePlayer?tableId=${tableId}&playerId=${newPlayerId}`
                );
                if (tablePlayerRes.status !== 200) {
                    console.log(tablePlayerRes.data.err);
                    navigate("/joinTable");
                    return;
                }

                const tableRes = await axios.get(
                    `http://localhost:3000/getTable?table_id=${tableId}`
                );
                // set default values
                setTableName(tableRes.data.name);
                setHandNum(tableRes.data.num_hands + 1); // must occur before setHasVpip due to handNum's useEffect hook
                setHasStarted(tableRes.data.has_started);

                // check if player is owner
                const ownerRes = await axios.get(
                    `http://localhost:3000/getPlayer?player_id=${tableRes.data.owner}`
                );
                if (ownerRes.status === 200) {
                    setOwnerName(ownerRes.data.username);
                }

                // check if the player has submitted a hand and vpip
                const newHandNum = tableRes.data.num_hands + 1;
                const handRes = await axios.get(
                    `http://localhost:3000/getHand?tableId=${tableId}&playerId=${newPlayerId}&handNum=${newHandNum}`
                );
                if (handRes.data.handExists) {
                    console.log("successful query");
                    console.log(handRes.data);
                    setHasVpip(true);

                    const newHandCid = handRes.data.hand.combination_id;
                    setCurHand(Hand.fromCid(newHandCid));
                    setHasEnteredHand(newHandCid >= 0);
                } else {
                    setHasVpip(false);
                    setHasEnteredHand(false);
                }
            } catch (err) {
                navigate("/joinTable");
                return;
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
        socket.on("updateHandDone", socketHandleUpdateHandDone);
        socket.on("nextHand", socketHandleNextHand);

        return () => {
            socket.off("updatePlayers", socketHandleUpdatePlayers);
            socket.off("startGame", socketHandleStartGame);
            socket.off("removeBuyinAlert", socketHandleRemoveBuyinAlert);
            socket.off("updateHandDone", socketHandleUpdateHandDone);
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

    // Update isActive whenever players changes
    useEffect(() => {
        const player = players.find((e) => e.name === username);
        if (player) {
            setIsActive(player.isActive);
        }
    }, [players]);

    async function handleLeave() {
        socket.emit("leaveTable", tableId, playerId);
        navigate("/joinTable");
    }

    function isOwner() {
        return ownerName !== "" && ownerName === username;
    }

    function handleStart() {
        if (players.filter((e) => e.isActive).length < 2) {
            window.alert("Not enough active players to start");
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
                socket.emit("checkHandDone", tableId, handNum);
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

    function handleChangeStatus() {
        socket.emit("changeStatus", tableId, playerId);
        socket.once("changeStatusDone", () => {
            socket.emit("checkHandDone", tableId, handNum);
        });
    }

    function tableCanPlay() {
        return players.filter((e) => e.isActive).length >= 2;
    }
    
    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", handleLeave);

    return (
        <div className={`flex justify-center items-center h-screen w-screen ${(!hasStarted || tableCanPlay()) && isActive ? "" : "bg-gray-500/40"}`}>
            <Button className="fixed top-5 left-5 z-50" onClick={handleChangeStatus}>
                {isActive ? "Sit out" : "Deal me in"}
            </Button>
            <div className={"flex justify-center items-center h-screen w-full max-w-120"}>
                <div className="flex flex-col h-9/10 w-9/10">
                    <div className="flex w-full mt-7">
                        <div className="flex flex-col justify-center w-14/29 p-2">
                            <Greeting name={username} />
                            <TableWelcome name={tableName} code={parseInt(tableId)} />

                            Starting positions:
                            <div className="mb-10">
                                <ul>
                                    {players.map((e, i) => 
                                        <li key={i} className="flex">
                                            <span className="w-7">{e.name === ownerName ? "⭐" : ""}</span>
                                            <span className={`w-15 ${e.isActive ? "font-bold" : "text-gray-500"}`}>{calcPosition(i, players.length)}</span>
                                            <span className={`${e.name === username ? "underline" : ""}`}>{e.name}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <Button onClick={handleLeave}>Leave table</Button>
                        </div>
                        <div className="flex justify-center flex-col w-15/29 p-2">
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
                    </div>
                    <div className="flex justify-center w-full h-full">
                        {hasStarted
                            ? tableCanPlay() && isActive
                                ? <div className="flex flex-col w-full pt-20 px-10">
                                    <div className="flex justify-center w-full text-6xl">
                                        Hand {handNum}
                                    </div>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button className="my-1" disabled={hasEnteredHand || !isActive}>Enter hand (optional)</Button>
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
                                                                1. Rank
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
                                                                Suit
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
                                                                2. Rank
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
                                                                Suit
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
                                                    <DialogFooter className="mt-6">
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
                                            <Button className="my-1" disabled={hasVpip || !isActive}>VPIP</Button>
                                        </DialogTrigger>
                                        <Form {...vpipForm}>
                                            <DialogContent className="w-50 h-45">
                                                <form onSubmit={vpipForm.handleSubmit(onVpip)} className="flex flex-col">
                                                    <DialogHeader className="mb-2">
                                                        <DialogTitle>
                                                            VPIP
                                                        </DialogTitle>
                                                        <DialogDescription />
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
                                                    <DialogFooter className="mt-5">
                                                        <DialogClose asChild>
                                                            <Button type="submit">Confirm</Button>
                                                        </DialogClose>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Form>
                                    </Dialog>
                                    {isOwner()
                                        ? <Button className="mt-3" disabled={!isHandDone} onClick={handleNext}>
                                            Next Hand
                                        </Button>
                                        : <></>
                                    }
                                </div>
                                : <div className="flex flex-col justify-center text-center text-xl w-full h-full text-center items-center">
                                    <span className="font-bold text-3xl">Paused</span>
                                    {isActive
                                        ? "At least 2 active players required"
                                        : `Press "Deal me in" to play`
                                    }
                                </div>
                            : <div className="flex justify-center text-center w-full h-full items-center">
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
        </div>
    );
}
