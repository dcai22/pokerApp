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
                    <DialogTitle />
                    <DialogDescription />
                </DialogHeader>
                
                <Tabs defaultValue="account" className="w-full h-full overflow-auto">
                    <TabsList className="w-full">
                        <TabsTrigger value="stats">Hand stats</TabsTrigger>
                        <TabsTrigger value="history">Hand history</TabsTrigger>
                    </TabsList>
                    <TabsContent value="stats" className="flex flex-col justify-center items-center">
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