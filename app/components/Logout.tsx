import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "./ui/button";
import { API_BASE } from "~/root";

interface LogoutProps {
    playerId: number,
    token: string,
}

export default function Logout({ playerId, token }: LogoutProps) {
    const navigate = useNavigate();

    async function onClick() {
        await axios.delete(
            `${API_BASE}/deleteToken?playerId=${playerId}&token=${token}`,
        );
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("playerId");

        navigate("/login");
    }

    return (
    <>
        <Button onClick={onClick}>Log out</Button>
    </>
    )
}