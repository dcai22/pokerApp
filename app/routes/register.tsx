import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";
import { genHash } from "~/helpers";

// TODO: error message from loaderData
export default function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) navigate("/joinTable");
    }, []);

    async function handleRegister() {
        const hashedPassword = await genHash(password);
        try {
            const res = await axios.post(
                "http://localhost:3000/registerPlayer",
                {
                    username,
                    hashedPassword,
                }
            );
            if (res.status === 200) {
                sessionStorage.setItem("token", res.data.token);
                navigate("/joinTable");
            } else {
                window.alert("register error");
            }
        } catch (err) {
            window.alert("username is taken")
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <h1 className="mb-2">Register a PokerApp account:</h1>
                <Input placeholder="Username" name="username" type="text" className="mb-2" value={username} onChange={(e) => setUsername(e.target.value)}></Input>
                <Input placeholder="Password" name="password" type="password" className="mb-2" value={password} onChange={(e) => setPassword(e.target.value)}></Input>
                <Button className="mb-10" onClick={handleRegister}>Register</Button>

                <h1 className="mb-1">Already have an account?</h1>
                <Button onClick={() => navigate("/login")}>Login here</Button>
            </div>
        </div>
    );
}
