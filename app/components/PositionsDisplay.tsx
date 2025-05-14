import { useEffect, useState } from "react";
import type { LocalPlayerData } from "server/interface";
import { calcPosition } from "~/helpers";
import { Spinner } from "./ui/spinner";

interface PositionsDisplayProps {
    players: LocalPlayerData[],
    ownerName: string,
    username: string,
}

export default function PositionsDisplay({ players, ownerName, username }: PositionsDisplayProps) {
    const [listComponent, setListComponent] = useState(<Spinner />);

    useEffect(() => {
        if (players.length === 0) return;
        setListComponent(
            <ul>
                {players.map((e, i) => 
                    <li key={i} className={`flex ${e.isActive ? "" : "text-gray-400"}`}>
                        <span className="w-7">{e.name === ownerName ? "⭐" : ""}</span>
                        <span className="w-15 font-bold">{calcPosition(i, players.length)}</span>
                        <span className={`${e.name === username ? "underline" : ""}`}>{e.name}</span>
                    </li>
                )}
            </ul>
        );
    }, [players]);

    return (
        <>
            Starting positions:
            <div className="mb-10">
                {listComponent}
            </div>
        </>
    )
}
