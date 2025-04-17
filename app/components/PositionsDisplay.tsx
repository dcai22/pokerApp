import type { LocalPlayerData } from "server/interface";
import { calcPosition } from "~/helpers";

interface PositionsDisplayProps {
    players: LocalPlayerData[],
    ownerName: string,
    username: string,
}

export default function PositionsDisplay({ players, ownerName, username }: PositionsDisplayProps) {
    return (
        <>
            Starting positions:
            <div className="mb-10">
                <ul>
                    {players.map((e, i) => 
                        <li key={i} className="flex">
                            <span className="w-7">{e.name === ownerName ? "⭐" : ""}</span>
                            <span className={`w-15 ${e.isActive ? "font-bold" : "text-gray-500"}`}>{calcPosition(i, players.length)}</span>
                            <span className={`${e.name === username ? "underline" : ""}`}>{e.name}</span>
                        </li>
                    )}
                </ul>
            </div>
        </>
    )
}
