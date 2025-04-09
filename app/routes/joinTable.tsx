import axios from "axios";
import { useNavigate } from "react-router";
import Logout from "~/components/Logout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import Greeting from "~/components/Greeting";
import { useEffect, useState } from "react";
import { authToken } from "~/helpers";

function JoinTable() {
    const navigate = useNavigate();

    const [token, setToken] = useState("");
    const [player_id, setPlayer_id] = useState(-1);
    const [username, setUsername] = useState("");
    const [table_id, setTable_id] = useState("");

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

        authAndInit();
    }, []);

    async function handleJoin() {
        try {
            const res = await axios.post(
                "http://localhost:3000/player/joinTable",
                {
                    player_id,
                    table_id: parseInt(table_id),
                }
            );
    
            if (res.status === 200) {
                navigate(`/table/${table_id}`);
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
                <h1 className="mb-2">Join a table:</h1>
                <Input placeholder="Table ID" name="table_id" type="text" className="mb-2" value={table_id} onChange={(e) => setTable_id(e.target.value)}></Input>
                <Button className="mb-10" onClick={handleJoin}>Join table</Button>

                <h1 className="mb-2">Don't have a table?</h1>
                <Button onClick={() => navigate(`/createTable`)} className="mb-10">Create a new table</Button>
                <Logout player_id={player_id} token={token} />
            </div>
        </div>
    );
}

export default JoinTable;
