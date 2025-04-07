import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { socket } from "app/root";

function RandomButton() {
    let [numYes, setNumYes] = useState(0);
    let [numNo, setNumNo] = useState(0);

    useEffect(() => {
        async function initVotes() {
            const res = await axios.get("http://localhost:3000/numVotes");
            if (res.status === 200) {
                setNumYes(res.data.num_yes);
                setNumNo(res.data.num_no);
            }
        }

        initVotes();
    }, []);

    function onVoteYes() {
        // setters don't update the value until the next render
        const [ newYes, newNo ] = [ numYes + 1, numNo ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put("http://localhost:3000/updateVotes", { numYes: newYes, numNo: newNo });

        socket.emit("newVote", newYes, newNo);
    }

    function onVoteNo() {
        const [ newYes, newNo ] = [ numYes, numNo + 1 ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put("http://localhost:3000/updateVotes", { numYes: newYes, numNo: newNo });

        socket.emit("newVote", newYes, newNo);
    }

    function onVoteReset() {
        const [ newYes, newNo ] = [ 0, 0 ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put("http://localhost:3000/updateVotes", { numYes: newYes, numNo: newNo });

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