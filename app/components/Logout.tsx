import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "./ui/button";
import { API_BASE } from "~/root";

interface LogoutProps {
    player_id: number,
    token: string,
}

export default function Logout({ player_id, token }: LogoutProps) {
    const navigate = useNavigate();

    async function onClick() {
        await axios.delete(
            `${API_BASE}/deleteToken`,
            {
                data: {
                    player_id,
                    token,
                }
            }
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