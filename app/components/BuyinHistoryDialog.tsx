import { useState, type JSX } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { LocalBuyinData } from "server/interface";

interface BuyinHistoryDialogProps {
    playerNames: string[],
    buyins: LocalBuyinData[],
}

export default function BuyinHistoryDialog({ playerNames, buyins }: BuyinHistoryDialogProps) {
    const [displayMode, setDisplayMode] = useState("all");

    function getBuyinHistoryComponent() {
        const displayBuyins = displayMode === "all"
            ? buyins
            : buyins.filter((e) => e.name === displayMode);

        if (displayBuyins.length === 0) {
            return (
                <div className="h-full italic text-gray-500 text-center">
                    No buyins yet
                </div>
            )
        }

        return (
            <ul className="divide-y divide-gray-500 h-full overflow-auto">
                {displayBuyins.map((e, i) => <li key={i} className="py-2">
                    <ul>
                        <li key="name" className="flex"><span className="w-20 font-bold">Player</span>{e.name}</li>
                        <li key="amount" className="flex"><span className="w-20 font-bold">Buyin</span>${e.amount}</li>
                        <li key="time" className="flex"><span className="w-20 font-bold">Time</span>{
                            (new Date(e.time)).toLocaleString("en-GB", {
                                dateStyle: "long",
                                timeStyle: "short",
                                timeZone: "Australia/Sydney",
                                hour12: true,
                            })
                        }</li>
                    </ul>
                </li>)}
            </ul>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Buyin history</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col h-2/3">
                <DialogHeader>
                    <DialogTitle>
                        Buyin History
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <Select onValueChange={setDisplayMode} defaultValue="all" >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <ul>
                            <SelectItem value="all" key="-1">All Players</SelectItem>
                            {playerNames.map((e, i) => 
                                <li key={i}><SelectItem value={e}>{e}</SelectItem></li>
                            )}
                        </ul>
                    </SelectContent>
                </Select>
                {getBuyinHistoryComponent()}
                <DialogFooter className="mt-1">
                    <DialogClose asChild>
                        <Button type="button">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}