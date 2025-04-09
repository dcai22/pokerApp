import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";

// TODO: error message from loaderData
export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (token) navigate("/joinTable");
    }, []);

    async function handleLogin() {
        try {
            const res = await axios.post(
                "http://localhost:3000/login",
                {
                    username,
                    password,
                }
            );
            
            if (res.status === 200) {
                sessionStorage.setItem("token", res.data.token);
                navigate("/joinTable");
            } else {
                window.alert("login error");
            }
        } catch (err) {
            window.alert("incorrect username or password");
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <h1 className="mb-2">PokerApp login:</h1>
                <Input placeholder="Username" name="username" type="text" className="mb-2" value={username} onChange={(e) => setUsername(e.target.value)}></Input>
                <Input placeholder="Password" name="password" type="password" className="mb-2" value={password} onChange={(e) => setPassword(e.target.value)}></Input>
                <Button className="mb-10" onClick={handleLogin}>Login</Button>

                <h1 className="mb-1">Don't have an account?</h1>
                <Button onClick={() => navigate("/register")}>Register an account</Button>
            </div>
        </div>
    );
}