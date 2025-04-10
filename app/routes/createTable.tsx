import { redirect, useNavigate } from "react-router";
import axios from "axios";
import Logout from "~/components/Logout";
import Greeting from "~/components/Greeting";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { authToken } from "~/helpers";

export default function CreateTable() {
    const navigate = useNavigate();

    const hasRun = useRef(false);

    const [token, setToken] = useState("");
    const [player_id, setPlayer_id] = useState(-1);
    const [username, setUsername] = useState("");
    const [tableName, setTableName] = useState("");
    const [smallBlind, setSmallBlind] = useState(1);
    const [bigBlind, setBigBlind] = useState(1);

    useEffect(() => {
        async function authAndInit() {
            const res = await authToken();
            if (res.navigate) {
                navigate("/login");
            } else {
                setToken(res.token as string);
                setPlayer_id(res.player_id);
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

    async function handleCreate() {
        if (smallBlind > bigBlind) {
            window.alert("small blind cannot be larger than big blind");
            return;
        }
    
        try {
            const res = await axios.post(
                "http://localhost:3000/player/createTable",
                {
                    name: tableName,
                    sb: smallBlind,
                    bb: bigBlind,
                    player_id,
                }
            );

            navigate(`/table/${res.data.table_id}`);
        } catch(err) {
            window.alert("cannot create table");
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <Greeting name={username} />
                <h1 className="mb-2">Create a new table!</h1>
                <Input placeholder="Table name" name="name" type="text" className="mb-2" value={tableName} onChange={(e) => setTableName(e.target.value)}></Input>
                <Input placeholder="Small blind" name="sb" type="number" className="mb-2" value={smallBlind} onChange={(e) => setSmallBlind(parseInt(e.target.value))}></Input>
                <Input placeholder="Big blind" name="bb" type="number" className="mb-2" value={bigBlind} onChange={(e) => setBigBlind(parseInt(e.target.value))}></Input>
                <Button className="mb-10" onClick={handleCreate}>Create table</Button>

                <h1 className="mb-2">Already have a table?</h1>
                <Button onClick={() => navigate(`/joinTable`)} className="mb-10">Join an existing table</Button>
                <Logout player_id={player_id} token={token} />
            </div>
        </div>
    );
}
