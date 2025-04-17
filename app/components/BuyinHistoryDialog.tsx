import type { JSX } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import type { Buyin } from "server/interface";

interface BuyinHistoryDialogProps {
    buyinHistoryComponent: JSX.Element,
}

export default function BuyinHistoryDialog({ buyinHistoryComponent }: BuyinHistoryDialogProps) {
    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button>Buyin history</Button>
                </DialogTrigger>
                <DialogContent className="max-h-7/8 overflow-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Buyin History
                        </DialogTitle>
                        <DialogDescription />
                    </DialogHeader>
                        {buyinHistoryComponent}
                    <DialogFooter className="mt-1">
                        <DialogClose asChild>
                            <Button type="button">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}