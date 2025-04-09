import axios from "axios";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router";

export async function genHash(str: string) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(str, salt);
    return hash;
}

export async function authToken() {
    const token = sessionStorage.getItem("token");
    if (!token) return { navigate: true };

    let player_id;
    try {
        const res = await axios.post(
            "http://localhost:3000/authToken",
            { token }
        );
        if (!res.data.player_id) {
            sessionStorage.removeItem("token");
            return { navigate: true };
        } else {
            player_id = res.data.player_id
        }
    } catch (err) {
        sessionStorage.removeItem("token");
        return { navigate: true };
    }

    let username;
    try {
        const res = await axios.get(
            `http://localhost:3000/getPlayer?player_id=${player_id}`,
        );
        if (res.status === 200) {
            username = res.data.username;
        } else {
            sessionStorage.removeItem("token");
            return { navigate: true };
        }
    } catch (err) {
        sessionStorage.removeItem("token");
        return { navigate: true };
    }

    return {
        navigate: false,
        token,
        player_id,
        username,
    };
}