import axios from "axios";
import { useNavigate, useParams } from "react-router";
import Greeting from "~/components/Greeting";
import { Button } from "~/components/ui/button";
import TableWelcome from "~/components/TableWelcome";
import { useEffect, useState } from "react";
import { authToken } from "~/helpers";

// TODO: remove table_players entry from database upon leaving page
export default function Table() {
    const navigate = useNavigate();

    const table_id = useParams().table_id as string;
    const [player_id, setPlayer_id] = useState(-1);
    const [username, setUsername] = useState("");
    const [tableName, setTableName] = useState("");

    // const [players, setPlayers] = useState(new Array());

    // if (loaderData.isOwner) {
    //     // TODO: fix bug of this being reached multiple times in one go
    //     socket.on("addPlayer", (username) => {
    //         const allPlayers = players;
    //         const index = Math.floor(Math.random() * (players.length + 1));
    //         if (!allPlayers.includes(username)) {
    //             setPlayers(allPlayers.splice(index, 0, username));
    //         }

    //         socket.emit("updatePlayers", players);
    //     });
    // }

    // socket.on("updatePlayers", (updatedPlayers) => {
    //     setPlayers(updatedPlayers);
    // });

    // useEffect(() => {
    //     socket.emit("addPlayer", loaderData.username);
    // }, []);

    useEffect(() => {
        async function authAndInit() {
            const res = await authToken();
            if (res.navigate) {
                navigate("/login");
            } else {
                setPlayer_id(res.player_id);
                setUsername(res.username);
            }

            try {
                const res = await axios.get(
                    `http://localhost:3000/getTable?table_id=${table_id}`
                );
                if (res.status === 200) {
                    setTableName(res.data.name);
                } else {
                    navigate("/joinTable");
                }
            } catch (err) {
                navigate("/joinTable");
            }
        }

        authAndInit();
    })

    async function leaveTable() {
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

    // SSR doesn't allow access to window
    // window.addEventListener("beforeunload", leaveTable);

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <Greeting name={username} />
            <TableWelcome name={tableName} code={parseInt(table_id)} />

            {/* {loaderData.players.map((e, i) => <li key={i}>{e}</li>)} TODO: change key to NOT use {i} as it is unsafe */}

            <Button onClick={leaveTable}>Leave table</Button>
        </div>
    );
}
