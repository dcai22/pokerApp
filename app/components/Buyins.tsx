interface BuyinsProps {
    players: {
        name: string,
        buyin: number,
    }[],
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
            There is <span className="font-bold">${getTableTotal()}</span> on the table<br />
            Total buyins:
            <ul>
                {players.map((e, i) => 
                    <li key={i}>
                        <span className="font-bold">{e.name}:</span> ${e.buyin} {
                            e.name ===  username
                                ? <span> (You)</span>
                                : <></>
                        }
                    </li>
                )}
            </ul>
        </div>
    );
}