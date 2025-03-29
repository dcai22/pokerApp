import { useState } from "react";


function RandomButton() {
    let [numClicks, setNumClicks] = useState(0);
    
    return (
        <>
            <h1 onClick={() => setNumClicks(numClicks + 1)}>CLICK ME</h1>
            <h1>{numClicks}</h1>
        </>
    );
}

export default RandomButton;