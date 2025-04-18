import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { API_BASE, socket } from "app/root";

function RandomButton() {
    const hasRun = useRef(false);

    let [numYes, setNumYes] = useState(0);
    let [numNo, setNumNo] = useState(0);

    useEffect(() => {
        async function initVotes() {
            const res = await axios.get(`${API_BASE}/authToken/numVotes`);
            if (res.status === 200) {
                setNumYes(res.data.num_yes);
                setNumNo(res.data.num_no);
            }

            sessionStorage.setItem("localNumYes", '0');
            socket.connect();
            console.log("A user has connected in RandomButton!");
        }

        if (!hasRun.current) {
            hasRun.current = true;
            initVotes();
        } else {
            console.log("effect was skipped to prevent double activation");
        }
    }, []);

    function onVoteYes() {
        // setters don't update the value until the next render
        const [ newYes, newNo ] = [ numYes + 1, numNo ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put(
            `${API_BASE}/updateVotes`,
            { numYes: newYes, numNo: newNo }
        );

        socket.emit("newVote", newYes, newNo);

        const localNumYes = parseInt(sessionStorage.getItem("localNumYes") ?? '0');
        sessionStorage.setItem("localNumYes", (localNumYes + 1).toString());
        console.log(sessionStorage.getItem("localNumYes"));
    }

    function onVoteNo() {
        const [ newYes, newNo ] = [ numYes, numNo + 1 ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put(
            `${API_BASE}/updateVotes`,
            { numYes: newYes, numNo: newNo }
        );

        socket.emit("newVote", newYes, newNo);
    }

    function onVoteReset() {
        const [ newYes, newNo ] = [ 0, 0 ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put(
            `${API_BASE}/updateVotes`,
            { numYes: newYes, numNo: newNo }
        );

        socket.emit("newVote", newYes, newNo);
    }

    function getPercentage() {
        const numTotal = numNo + numYes;
        return 100 * (numYes / (numTotal || 1));
    }

    socket.on("newVote", (newYes, newNo) => {
        setNumYes(newYes);
        setNumNo(newNo);
    });

    return (
        // Yes percentage edge case when numYes = numNo = 0
        <div className="flex flex-col">
            <Button onClick={onVoteYes} className="mb-1">VOTE YES</Button>
            <Button onClick={onVoteNo} className="mb-1">VOTE NO</Button>
            <div className="flex justify-center mb-1">Yes Votes: {numYes} / {numNo + numYes}</div>
            <div className="flex justify-center mb-2">Yes Percentage: {getPercentage().toFixed(2)}%</div>
            <Button onClick={onVoteReset} className="mb-1">RESET</Button>
        </div>
    );
}

export default RandomButton;