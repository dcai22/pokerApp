import type { LocalPlayerData } from "server/interface";
import { Spinner } from "./ui/spinner";
import { useEffect, useState } from "react";

interface BuyinsProps {
    players: LocalPlayerData[],
    username: string,
}

export default function Buyins({ players, username }: BuyinsProps) {
    const [listComponent, setListComponent] = useState(<Spinner />);

    useEffect(() => {
        if (players.length === 0) return;
        setListComponent(
            <ul>
                {players.map((e, i) => 
                    <li key={i}>
                        <span className={`font-bold ${e.name === username ? "underline" : ""}`}>{e.name}</span>: ${e.buyin}
                    </li>
                )}
            </ul>
        );
    }, [players]);

    function getTableTotal() {
        let tableTotal = 0;
        players.forEach((e) => tableTotal += Number(e.buyin));
        return tableTotal;
    }

    return (
        <div>
            Table total: {players.length > 0 ? <span className="font-bold">${getTableTotal()}</span> : <></>}<br />
            Player buyins:
            {listComponent}
        </div>
    );
}