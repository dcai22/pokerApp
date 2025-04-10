import axios from "axios";
import { useNavigate, useParams } from "react-router";
import Greeting from "~/components/Greeting";
import { Button } from "~/components/ui/button";
import TableWelcome from "~/components/TableWelcome";
import { useEffect, useRef, useState } from "react";
import { authToken, calcPosition } from "~/helpers";
import { socket } from "~/root";

// TODO: remove table_players entry from database upon leaving page
export default function Table() {
    const navigate = useNavigate();

    const hasRun = useRef(false);

    const table_id = useParams().table_id as string;
    const [player_id, setPlayer_id] = useState(-1);
    const [username, setUsername] = useState("");
    const [tableName, setTableName] = useState("");
    const [players, setPlayers] = useState(new Array());
    const [ownerName, setOwnerName] = useState("");
    
    socket.on("updatePlayers", (updatedPlayers) => {
        setPlayers(updatedPlayers);
    });
    
    useEffect(() => {
        async function authAndInit() {
            let newPlayerId;
            let newUsername;
            
            const res = await authToken();
            if (res.navigate) {
                navigate("/login");
            } else {
                newPlayerId = res.player_id;
                newUsername = res.username;
                setPlayer_id(newPlayerId);
                setUsername(newUsername);
            }

            socket.connect();
            console.log(`${newUsername} has connected in table!`);

            try {
                const tableRes = await axios.get(
                    `http://localhost:3000/getTable?table_id=${table_id}`
                );
                if (tableRes.status === 200) {
                    const ownerRes = await axios.get(
                        `http://localhost:3000/getPlayer?player_id=${tableRes.data.owner}`
                    );
                    if (ownerRes.status === 200) {
                        setOwnerName(ownerRes.data.username);
                    }

                    setTableName(tableRes.data.name);

                    if (tableRes.data.owner === newPlayerId) {
                        socket.on("addPlayerToOwner", (newUsername) => {
                            let allPlayers = players;
                            const index = Math.floor(Math.random() * (allPlayers.length + 1));
                            if (!allPlayers.includes(newUsername)) allPlayers.splice(index, 0, newUsername);

                            socket.emit("updatePlayers", allPlayers);
                        });
                    }
                } else {
                    navigate("/joinTable");
                }
            } catch (err) {
                navigate("/joinTable");
            }

            socket.emit("addPlayer", newUsername);
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
                        player_id,
                        table_id: table_id,
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

    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", handleLeave);

    return (
        <div className="flex">
            <div className="flex flex-col justify-center w-50 ml-10 mt-10">
                <Greeting name={username} />
                <TableWelcome name={tableName} code={parseInt(table_id)} />

                Starting positions:
                <div className="mb-10">
                    <ol>
                        {/* TODO: change key to NOT use {i} as it is unsafe */}
                        {players.map((e, i) => 
                            <li key={i} className="flex">
                                <span className="w-7">{e === ownerName ? "⭐" : ""}</span>
                                <span className="font-bold w-15">{calcPosition(i, players.length)}</span>
                                {e}
                            </li>
                        )}
                    </ol>
                </div>

                {isOwner() ? <Button className="mb-10">Start game</Button> : <></>}

                <Button onClick={handleLeave}>Leave table</Button>
            </div>
            <div className="flex w-screen items-center justify-center h-screen">
                <div>
                    {isOwner() ? <Button className="h-20 w-40 text-xl">Start game</Button> : <div className="text-xl text-center">Waiting for owner to start game...</div>}
                </div>
            </div>
        </div>
    );
}
