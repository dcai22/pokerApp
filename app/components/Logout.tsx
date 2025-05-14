import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "./ui/button";
import { API_BASE } from "~/root";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

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
        localStorage.removeItem("token");
        localStorage.removeItem("playerId");

        navigate("/login");
    }

    return (
    <>
        <Button onClick={onClick}>Log out</Button>
    </>
    )
}