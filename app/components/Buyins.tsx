interface BuyinsProps {
    players: {
        name: string,
        buyin: number,
    }[],
    username: string,
}

export default function Buyins({ players, username }: BuyinsProps) {
    return (
        <div>
            Total buyin:
            <ul>
                {players.map((e, i) => 
                    <li key={i}>
                        {e.name}: {e.buyin} {
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