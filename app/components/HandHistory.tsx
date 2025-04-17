import { Card, Hand, type LocalHandData } from "server/interface";
interface HandHistoryProps {
    hands: LocalHandData[],
}

export default function HandHistory({ hands }: HandHistoryProps) {
    if (hands.length === 0) {
        return (
            <div className="w-full h-full justify-center items-center text-center italic text-gray-500">
                No hands yet
            </div>
        )
    }

    function getImgSrc(card: Card | null) {
        return card === null
            ? "/cards/RED_BACK.svg"
            : `/cards/${Card.prettyPrint(card)}.svg`;
    }

    return (
        <>
            <ul className="divide-y divide-gray-500 h-full overflow-auto">
                {hands.map((e, i) => <li key={i} className="py-2">
                    <ul>
                        <span className="font-bold text-2xl">Hand {e.handNum}</span>
                        <li key="hand" className="flex">
                            <img className="h-20 max-w-full" src={getImgSrc(Hand.fromCid(e.cid).card1)} />
                            <img className="h-20 max-w-full" src={getImgSrc(Hand.fromCid(e.cid).card2)} />
                        </li>
                        <li key="vpip" className="flex font-bold">VPIP {e.vpip ? "✅" : "❌"}</li>
                    </ul>
                </li>)}
            </ul>
        </>
    )
}