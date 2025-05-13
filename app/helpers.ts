import axios from "axios";
import bcrypt from "bcryptjs";
import { API_BASE } from "./root";

export async function genHash(str: string) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(str, salt);
    return hash;
}

export async function authToken() {
    const token = localStorage.getItem("token");
    if (!token) return { navigate: true };

    // converts playerId to int
    const pidString = localStorage.getItem("playerId");
    if (pidString === null || Number.isNaN(parseInt(pidString))) return { navigate: true };
    const playerId = parseInt(pidString);

    let username;
    try {
        const res = await axios.post(
            `${API_BASE}/authToken`,
            { token, playerId }
        );
        if (res.data.message) {
            console.log(res.data.message);
            return { navigate: true };
        } else {
            username = res.data.username;
            console.log(username);
        }
    } catch (err) {
        return { navigate: true };
    }

    return {
        navigate: false,
        token,
        playerId,
        username,
    };
}

const positions = [ "SB", "BB", "UTG", "UTG1", "UTG2", "LJ", "HJ", "CO", "BTN" ]

// returns string corresponding to the name of position i (0-indexed) on an n-handed table
// requires 2 <= n <= 9, 0 <= i < n;
export function calcPosition(i: number, n: number) {
    if (i < 2) {
        return positions[i];
    }

    if (n - i <= 4) {
        return positions[9 - (n - i)];
    }

    return positions[i];
}

export function shiftArray(arr: any[], offset: number) {
    const len = arr.length;
    if (len === 0) return arr;
    const trueOffset = offset % len;
    let shiftedArr = new Array(len);
    arr.forEach((e, i) => {
        shiftedArr[(i + offset) % len] = e;
    })
    return shiftedArr;
}
