import type { LocalHandData } from "server/interface";
import HandStats from "./HandStats";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import HandHistory from "./HandHistory";

interface StatsDialogProps {
    hands: LocalHandData[],
}

export default function StatsDialog({ hands }: StatsDialogProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="fixed right-5">Stats</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col h-2/3">
                <DialogHeader>
                    <DialogTitle>
                        Hand Statistics
                    </DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                
                <Tabs defaultValue="summary" className="w-full h-full overflow-auto">
                    <TabsList className="w-full">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="summary" className="flex flex-col justify-center items-center">
                        <HandStats hands={hands} />
                    </TabsContent>
                    <TabsContent value="history">
                        <HandHistory hands={hands} />
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
