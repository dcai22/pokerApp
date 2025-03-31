import { useEffect, useState } from "react";
import axios from "axios";

function RandomButton() {
    let [numYes, setNumYes] = useState(0);
    let [numNo, setNumNo] = useState(0);

    useEffect(() => {
        async function initVotes() {
            const res = await axios.get("http://localhost:3000/numVotes");
            if (res.status === 200) {
                setNumYes(res.data.numyes);
                setNumNo(res.data.numno);
            }
        }

        initVotes();
    }, []);

    function onVoteYes() {
        // setters don't update the value until the next render
        const [ newYes, newNo ] = [ numYes + 1, numNo ];
        setNumYes(newYes);
        axios.put("http://localhost:3000/updateVotes", { numYes: newYes, numNo: newNo });
    }

    function onVoteNo() {
        const [ newYes, newNo ] = [ numYes, numNo + 1 ];
        setNumNo(newNo);
        axios.put("http://localhost:3000/updateVotes", { numYes: newYes, numNo: newNo });
    }

    function onVoteReset() {
        const [ newYes, newNo ] = [ 0, 0 ];
        setNumYes(newYes);
        setNumNo(newNo);
        axios.put("http://localhost:3000/updateVotes", { numYes: newYes, numNo: newNo });
    }

    return (
        // Yes percentage edge case when numYes = numNo = 0
        <>
            <h1 onClick={onVoteYes}>VOTE YES</h1>
            <h1 onClick={onVoteNo}>VOTE NO</h1>
            <h1>Yes Votes: {numYes} / {numNo + numYes}</h1>
            <h1>Yes Percentage: {(100 * (numYes / ((numNo + numYes) || 1))).toFixed(2)}%</h1>
            <h1 onClick={onVoteReset}>RESET</h1>
        </>
    );
}

export default RandomButton;