import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "./ui/button";

interface LogoutProps {
    player_id: number,
    token: string,
}

export default function Logout({ player_id, token }: LogoutProps) {
    const navigate = useNavigate();

    async function onClick() {
        await axios.delete(
            "http://localhost:3000/deleteToken",
            {
                data: {
                    player_id,
                    token,
                }
            }
        );
    
        navigate("/login");
    }

    return (
    <>
        <Button onClick={onClick}>Log out</Button>
    </>
    )
}