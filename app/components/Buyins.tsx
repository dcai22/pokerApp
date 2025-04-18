import type { LocalPlayerData } from "server/interface";

interface BuyinsProps {
    players: LocalPlayerData[],
    username: string,
}

export default function Buyins({ players, username }: BuyinsProps) {
    function getTableTotal() {
        let tableTotal = 0;
        players.forEach((e) => tableTotal += Number(e.buyin));
        return tableTotal;
    }

    return (
        <div>
            There is <span className="font-bold">${getTableTotal()}</span> on the table.<br />
            Total buyins:
            <ul>
                {players.map((e, i) => 
                    <li key={i}>
                        <span className={`font-bold ${e.name === username ? "underline" : ""}`}>{e.name}</span>: ${e.buyin}
                    </li>
                )}
            </ul>
        </div>
    );
}