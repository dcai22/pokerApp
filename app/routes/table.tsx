import axios from "axios";
import { useNavigate, useParams } from "react-router";
import Greeting from "~/components/Greeting";
import { Button } from "~/components/ui/button";
import TableWelcome from "~/components/TableWelcome";
import { useEffect, useRef, useState, type SetStateAction } from "react";
import { authToken } from "~/helpers";
import { API_BASE, socket } from "~/root";
import Buyins from "~/components/Buyins";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, Hand, type LocalBuyinData, type LocalHandData } from "server/interface";
import PositionsDisplay from "~/components/PositionsDisplay";
import BuyinDialog from "~/components/BuyinDialog";
import { buyinFormSchema, handFormSchema, vpipFormSchema } from "~/formSchemas";
import BuyinHistoryDialog from "~/components/BuyinHistoryDialog";
import EnterHandDialog from "~/components/EnterHandDialog";
import VpipDialog from "~/components/VpipDialog";
import StatsDialog from "~/components/StatsDialog";
import TableStatsDialog from "~/components/TableStatsDialog";

export default function Table() {
    const navigate = useNavigate();

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
    const [lastBuyinRemovedTime, setLastBuyinRemovedTime] = useState(null as (string | null));
    const [buyinHistory, setBuyinHistory] = useState([] as LocalBuyinData[]);
    const [handNum, setHandNum] = useState(1);
    const [hasEnteredHand, setHasEnteredHand] = useState(false);
    const [hasVpip, setHasVpip] = useState(false);
    const [curHand, setCurHand] = useState(new Hand(null, null));
    const [isHandDone, setIsHandDone] = useState(false);
    const [rank1Offset, setRank1Offset] = useState(Math.floor(13 * Math.random()));
    const [suit1Offset, setSuit1Offset] = useState(Math.floor(4 * Math.random()));
    const [rank2Offset, setRank2Offset] = useState(Math.floor(13 * Math.random()));
    const [suit2Offset, setSuit2Offset] = useState(Math.floor(4 * Math.random()));
    const [isActive, setIsActive] = useState(false);
    const [handHistory, setHandHistory] = useState([] as LocalHandData[]);
    const [wantEndGame, setWantEndGame] = useState(false);
    const [endGameSuggested, setEndGameSuggested] = useState(false);
    const [hasEnded, setHasEnded] = useState(false);
    const [allHands, setAllHands] = useState([]);
    
    async function socketHandleUpdatePlayers(updatedPlayers: SetStateAction<any[]>) {
        setPlayers(updatedPlayers);
        console.log(updatedPlayers);
    }

    function socketHandleStartGame() {
        setHasStarted(true);
        setHasEnteredHand(false);
        setHasVpip(false);
    }

    function socketHandleRemoveBuyinAlert(newLastBuyinRemovedTime: SetStateAction<string | null>) {
        setLastBuyinRemovedTime(newLastBuyinRemovedTime);
    }

    function socketHandleUpdateHandDone(newIsHandDone: boolean | ((prevState: boolean) => boolean)) {
        setIsHandDone(newIsHandDone);
    }

    function socketHandleNextHand(newHandNum: SetStateAction<number>) {
        setHandNum(newHandNum);
    }

    function socketHandleEndGameSuggested() {
        setEndGameSuggested(true);
    }

    function socketHandleEndGame() {
        setHasEnded(true);
    }

    function socketHandleCancelEndGame() {
        setWantEndGame(false);
        setEndGameSuggested(false);
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
                    `${API_BASE}/getTablePlayer?tableId=${tableId}&playerId=${newPlayerId}`
                );
                if (tablePlayerRes.status !== 200) {
                    console.log(tablePlayerRes.data.err);
                    navigate("/joinTable");
                    return;
                } else {
                    setWantEndGame(tablePlayerRes.data.want_end_game);
                }

                const tableRes = await axios.get(
                    `${API_BASE}/getTable?table_id=${tableId}`
                );
                // set default values
                setTableName(tableRes.data.name);
                setHandNum(tableRes.data.num_hands + 1); // must occur before setHasVpip due to handNum's useEffect hook
                setHasStarted(tableRes.data.has_started);
                setHasEnded(tableRes.data.has_ended);

                // check if player is owner
                const ownerRes = await axios.get(
                    `${API_BASE}/getPlayer?player_id=${tableRes.data.owner}`
                );
                if (ownerRes.status === 200) {
                    setOwnerName(ownerRes.data.username);
                }

                // check if owner wants to end the game
                const ownerTpRes = await axios.get(
                    `${API_BASE}/getTablePlayer?tableId=${tableId}&playerId=${newPlayerId}`
                );
                if (ownerTpRes.status === 200) {
                    setEndGameSuggested(ownerTpRes.data.want_end_game);
                }

                // check if the player has submitted a hand and vpip
                const newHandNum = tableRes.data.num_hands + 1;
                const handRes = await axios.get(
                    `${API_BASE}/getHand?tableId=${tableId}&playerId=${newPlayerId}&handNum=${newHandNum}`
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

            socket.emit("joinTable");
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
        socket.on("endGameSuggested", socketHandleEndGameSuggested);
        socket.on("endGame", socketHandleEndGame);
        socket.on("cancelEndGame", socketHandleCancelEndGame);

        return () => {
            socket.off("updatePlayers", socketHandleUpdatePlayers);
            socket.off("startGame", socketHandleStartGame);
            socket.off("removeBuyinAlert", socketHandleRemoveBuyinAlert);
            socket.off("updateHandDone", socketHandleUpdateHandDone);
            socket.off("nextHand", socketHandleNextHand);
            socket.off("endGameSuggested", socketHandleEndGameSuggested);
            socket.off("endGame", socketHandleEndGame);
            socket.off("cancelEndGame", socketHandleCancelEndGame);
        }
    }, []);

    // Reset values for new hand
    useEffect(() => {
        setHasEnteredHand(false);
        setHasVpip(false);
        setCurHand(new Hand(null, null));
        setIsHandDone(false);
        setRank1Offset(Math.floor(13 * Math.random()));
        setSuit1Offset(Math.floor(4 * Math.random()));
        setRank2Offset(Math.floor(13 * Math.random()));
        setSuit2Offset(Math.floor(4 * Math.random()));

        const newPlayers = players.map(p => Object.assign(p, { hasVpip: false }));
        setPlayers(newPlayers);

        updateHandHistory();
    }, [handNum]);

    // Update isActive whenever players changes
    useEffect(() => {
        const player = players.find((e) => e.name === username);
        if (player) {
            setIsActive(player.isActive);
        }
        updateBuyinHistory();
    }, [players]);

    useEffect(() => {
        if (lastBuyinTime === lastBuyinRemovedTime) setBuyinAlert(<></>);
    }, [lastBuyinRemovedTime])

    useEffect(() => {
        async function getAllHands() {
            try {
                const res = await axios.get(
                    `${API_BASE}/getAllHands?tableId=${tableId}`
                );
                setAllHands(res.data.hands);
            } catch (err) {
                console.log(err);
            }
        }

        if (!hasEnded) return;
        getAllHands();
    }, [hasEnded]);

    async function handleLeave() {
        socket.emit("leaveTable");
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

        socket.emit("startGame");
    }

    async function onBuyin(values: z.infer<typeof buyinFormSchema>) {
        const amount = values.amount;
        const buyinTime = (new Date()).toISOString();
        
        try {
            const res = await axios.post(
                `${API_BASE}/player/buyin`,
                {
                    amount,
                    buyinTime,
                    tableId,
                    playerId,
                }
            );

            if (res.status === 200) {
                const newBuyinAlert = (
                    <Alert className="fixed bottom-4 right-4 z-50 w-50" onClick={() => setBuyinAlert(<></>)}>
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                        <div><span className="font-bold">{username}</span> bought in for ${amount}</div>
                    </AlertDescription>
                    </Alert>
                );
                setLastBuyinTime(buyinTime);
                setBuyinAlert(newBuyinAlert);
            } else {
                window.alert("Error: couldn't buy in");
                return;
            }
        } catch (err) {
            console.log(err);
            return;
        }

        socket.emit("newBuyin", buyinTime);
    }

    async function updateBuyinHistory() {
        try {
            const res = await axios.get(`${API_BASE}/player/getBuyins?tableId=${tableId}`);
            if (res.status === 200) {
                setBuyinHistory(res.data.buyins);
            } else {
                console.log("Error fetching buyin history");
            }
        } catch (err) {
            console.log("Error fetching buyin history");
        }
    }

    async function updateHandHistory() {
        try {
            const res = await axios.get(
                `${API_BASE}/player/getHands?playerId=${playerId}&tableId=${tableId}`
            );
            setHandHistory(res.data.hands);
        } catch (err) {
            console.log(err);
        }
    }

    async function onVpip(data: z.infer<typeof vpipFormSchema>) {
        const option = data.option
        
        try {
            const res = await axios.post(
                `${API_BASE}/player/vpip`,
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
                socket.emit("checkHandDone", handNum);
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

        if (rank1 === rank2 && suit1 === suit2) {
            console.log("Error: Cards can't be the same. Please try again.");
            return;
        }

        const newHand = [rank1, suit1, rank2, suit2].includes("")
            ? new Hand(null, null)
            : new Hand(new Card(rank1, suit1), new Card(rank2, suit2));
        if (newHand.isNull()) {
            console.log("Error: Not all fields selected. Please try again.");
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
                `${API_BASE}/player/addHand`,
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
        socket.emit("alertNextHand", handNum);
    }

    function handleChangeStatus() {
        socket.emit("changeStatus");
        socket.once("changeStatusDone", () => {
            socket.emit("checkHandDone", handNum);
        });
    }

    function tableCanPlay() {
        return players.filter((e) => e.isActive).length >= 2;
    }

    function handleSuggestEndGame() {
        setWantEndGame(true);
        socket.emit("suggestEndGame");
        socket.emit("agreeEndGame");
    }

    function handleAgreeEndGame() {
        setWantEndGame(true);
        socket.emit("agreeEndGame");
    }

    function handleDisagreeEndGame() {
        socket.emit("disagreeEndGame");
    }

    function getWaitingOnComponent() {
        const playersWithoutVpip = players.filter(p => p.isActive && !p.hasVpip).map(p => p.name);
        return (
            <div className="flex flex-col items-center justify-center border-3 my-1 p-1 border-gray-400">
                <span className="text-2xl font-bold">Waiting on:</span>
                {playersWithoutVpip.length > 0
                    ? <ul className="text-xl">
                        {playersWithoutVpip.map((p, i) => <li key={i} className={p === username ? "underline" : ""}>
                            {p}
                        </li>)}
                    </ul>
                    : <div className="text-xl italic text-gray-500">Nobody!</div>
                }
            </div>
        );
    }

    return (
        <div className={`flex justify-center items-center h-screen w-screen ${hasEnded || (isActive && (!hasStarted || tableCanPlay())) ? "" : "bg-gray-500/40"}`}>
            {hasEnded
                ? <></>
                : <div className="fixed top-0 z-50 w-full h-18 bg-gray-500/90 border-b border-black">
                    <div className="fixed top-4">
                        <Button className="fixed left-5" onClick={handleChangeStatus}>
                            {isActive ? "Sit out" : "Deal me in"}
                        </Button>
                        <StatsDialog hands={handHistory} />
                    </div>
                </div>
            }
            <div className={"flex justify-center items-center h-screen w-full max-w-120"}>
                <div className="flex flex-col h-9/10 w-9/10">
                    <div className="flex w-full mt-7">
                        <div className="flex flex-col justify-center w-14/29 p-2">
                            <Greeting name={username} />
                            <TableWelcome name={tableName} code={parseInt(tableId)} />
                            <PositionsDisplay players={players} ownerName={ownerName} username={username} />
                            <Button onClick={handleLeave}>Leave table</Button>
                        </div>
                        <div className="flex justify-center flex-col w-15/29 p-2">
                            <Buyins players={players} username={username} />
                            <BuyinDialog onBuyin={onBuyin} disabled={hasEnded} />
                            <BuyinHistoryDialog playerNames={players.map((p) => p.name)} buyins={buyinHistory} />
                        </div>
                    </div>
                    <div className="flex justify-center w-full h-full">
                        {hasEnded
                            ? <div className="flex flex-col justify-center h-full items-center">
                                <div className="text-3xl">Game has ended</div>
                                <TableStatsDialog playerNames={players.map(p => p.name)} hands={allHands} />
                            </div>
                            : hasStarted
                                ? tableCanPlay() && isActive
                                    ? <div className="flex flex-col w-full pt-20 px-10">
                                        <div className="flex justify-center w-full text-6xl">
                                            Hand {handNum}
                                        </div>
                                        <EnterHandDialog 
                                            disabled={hasEnteredHand || !isActive}
                                            onEnterHand={onEnterHand}
                                            rank1Offset={rank1Offset}
                                            suit1Offset={suit1Offset}
                                            rank2Offset={rank2Offset}
                                            suit2Offset={suit2Offset}
                                        />
                                        <VpipDialog
                                            disabled={hasVpip || !isActive}
                                            onVpip={onVpip}
                                        />
                                        {getWaitingOnComponent()}
                                        {isOwner()
                                            ? <Button className="my-1" disabled={!isHandDone} onClick={handleNext}>
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
            <div className="fixed right-5 bottom-5">
                {hasEnded
                    ? <></>
                    : endGameSuggested
                        ? wantEndGame
                            ? <div className="flex flex-col">
                                You voted to end the game
                                <Button onClick={handleDisagreeEndGame}>Cancel</Button>
                            </div>
                            : <div className="flex flex-col">
                                Owner wants to end game
                                <Button onClick={handleAgreeEndGame}>Accept</Button>
                                <Button onClick={handleDisagreeEndGame}>Decline</Button>
                            </div>
                        : isOwner()
                            ? <Button onClick={handleSuggestEndGame}>End Game</Button>
                            : <></>
                }
            </div>
        </div>
    );
}
