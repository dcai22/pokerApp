import type { HandData } from "server/interface";
import HandStats from "./HandStats";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import HandHistory from "./HandHistory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface HandStatsDialogProps {
    playerNames: string[]
    hands: HandData[],
}

export default function HandStatsDialog({ playerNames, hands }: HandStatsDialogProps) {
    const [displayMode, setDisplayMode] = useState("all");

    function modifyHands(hands: HandData[]) {
        const filteredHands = displayMode === "all"
            ? hands
            : hands.filter(h => h.name === displayMode);
        return filteredHands.map(h => {
            return {
                handNum: h.handNum,
                cid: h.cid,
                vpip: h.vpip,
            };
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-55 h-18 text-3xl my-4">Global Stats</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col h-2/3">
                <DialogHeader>
                    <DialogTitle>
                        Hand Statistics
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>

                <Select onValueChange={setDisplayMode} defaultValue="all" >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <ul>
                            <SelectItem value="all" key="-1">Combined</SelectItem>
                            {playerNames.map((e, i) => 
                                <li key={i}><SelectItem value={e}>{e}</SelectItem></li>
                            )}
                        </ul>
                    </SelectContent>
                </Select>

                <Tabs defaultValue="summary" className="w-full h-full overflow-auto">
                    <TabsList className="w-full">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="flex flex-col justify-center items-center">
                        <HandStats hands={modifyHands(hands)} />
                    </TabsContent>
                    <TabsContent value="history">
                        <HandHistory hands={modifyHands(hands)} />
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-1">
                    <DialogClose asChild>
                        <Button type="button">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}