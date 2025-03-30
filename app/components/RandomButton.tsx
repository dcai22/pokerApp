import { useState } from "react";


function RandomButton() {
    let [numYes, setNumYes] = useState(0);
    let [numNo, setNumNo] = useState(0);
    
    return (
        // Yes percentage edge case when numYes = numNo = 0
        <>
            <h1 onClick={() => setNumYes(numYes + 1)}>VOTE YES</h1>
            <h1 onClick={() => setNumNo(numNo + 1)}>VOTE NO</h1>
            <h1>Yes Votes: {numYes} / {numNo + numYes}</h1>
            <h1>Yes Percentage: {numYes / ((numNo + numYes) || 1)}</h1>
            <h1 onClick={() => { setNumYes(0); setNumNo(0); }}>RESET</h1>
        </>
    );
}

export default RandomButton;