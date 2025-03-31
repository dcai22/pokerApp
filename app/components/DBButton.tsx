// import { useState } from "react";

// function DBButton() {
//     function onClick() {
//         let db = getDb();
//         let vpip = db.collection("testButton").find({ _id: '67e9481ef1a5744d702733cc' });
//         setValue(vpip.numYes + vpip.numNo);
//         console.log("CLICKED");
//     }

//     let [value, setValue] = useState(-1);
    
//     return (
//         <>
//             <h1 onClick={onClick}>CLICK ME</h1>
//             <h1>{value}</h1>
//         </>
//     )
// }

// export default DBButton;