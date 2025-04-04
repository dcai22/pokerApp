import { Form, redirect, useNavigate } from "react-router";
import axios from "axios";

export default function Logout({ player_id, token }: { player_id: number, token: string }) {
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
        <h1 onClick={onClick}>LOG OUT</h1>
    </>
    )
}