import { Hand, type LocalHandData } from "server/interface";

interface HandStatsProps {
    hands: LocalHandData[],
}

export default function HandStats({ hands }: HandStatsProps) {
    const numHands = hands.length;
    if (numHands === 0) {
        return (
            <div className="w-full h-full justify-center items-center text-center italic text-gray-500">
                No hands yet
            </div>
        )
    }

    function getVpipRate() {
        const numVpip = hands.filter(h => h.vpip).length;
        return {
            fraction: `${numVpip} / ${numHands}`,
            percentage: `${(100 * numVpip / numHands).toFixed(2)}%`
        }
    }

    function getHandsRecorded() {
        return hands.filter(h => h.cid >= 0).length;
    }

    function getSuitedness() {
        const numRecorded = getHandsRecorded();
        const numSuited = hands.filter(h => Hand.fromCid(h.cid).isSuited()).length;
        return {
            fraction: `${numSuited} / ${numRecorded}`,
            percentage: numRecorded ? `${(100 * numSuited / numRecorded).toFixed(2)}%` : "0.00%",
        }
    }

    function getConnectedness() {
        const numRecorded = getHandsRecorded();
        const numConnected = hands.filter(h => Hand.fromCid(h.cid).isConnected()).length;
        return {
            fraction: `${numConnected} / ${numRecorded}`,
            percentage: numRecorded ? `${(100 * numConnected / numRecorded).toFixed(2)}%` : "0.00%",
        }
    }

    function getPairedness() {
        const numRecorded = getHandsRecorded();
        const numPaired = hands.filter(h => Hand.fromCid(h.cid).isPaired()).length;
        return {
            fraction: `${numPaired} / ${numRecorded}`,
            percentage: numRecorded ? `${(100 * numPaired / numRecorded).toFixed(2)}%` : "0.00%",
        }
    }

    function getSuitedConnectedness() {
        const numRecorded = getHandsRecorded();
        const numSuitedConnected = hands.filter(h => Hand.fromCid(h.cid).isSuitedConnector()).length;
        return {
            fraction: `${numSuitedConnected} / ${numRecorded}`,
            percentage: numRecorded ? `${(100 * numSuitedConnected / numRecorded).toFixed(2)}%` : "0.00%",
        }
    }

    return (
        <div className="flex flex-col items-center h-full divide-y divide-gray-500">
            <div className="flex flex-col items-center h-full w-full my-1">
                <span className="font-bold">Hands recorded</span>
                <span>{getHandsRecorded()} / {numHands} ({(100 * getHandsRecorded() / numHands).toFixed(2)}%)</span>
            </div>
            <div className="flex flex-col items-center h-full w-full my-1">
                <span className="font-bold">VPIP</span>
                <span>{getVpipRate().fraction} ({getVpipRate().percentage})</span>
            </div>
            <div className="flex flex-col items-center h-full w-full my-1">
                <span className="font-bold">Suited</span>
                <span>{getSuitedness().fraction} ({getSuitedness().percentage})</span>
            </div>
            <div className="flex flex-col items-center h-full w-full my-1">
                <span className="font-bold">Connected</span>
                <span>{getConnectedness().fraction} ({getConnectedness().percentage})</span>
            </div>
            <div className="flex flex-col items-center h-full w-full my-1">
                <span className="font-bold">Suited Connector</span>
                <span>{getSuitedConnectedness().fraction} ({getSuitedConnectedness().percentage})</span>
            </div>
            <div className="flex flex-col items-center h-full w-full my-1">
                <span className="font-bold">Paired</span>
                <span>{getPairedness().fraction} ({getPairedness().percentage})</span>
            </div>
        </div>
    )
}