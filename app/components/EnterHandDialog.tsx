import { useForm } from "react-hook-form";
import RankSelect from "./RankSelect";
import SuitSelect from "./SuitSelect";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { z } from "zod";
import { handFormSchema } from "~/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";

interface EnterHandDialogProps {
    disabled: boolean,
    onEnterHand(data: z.infer<typeof handFormSchema>): Promise<void>,
    rank1Offset: number,
    suit1Offset: number,
    rank2Offset: number,
    suit2Offset: number,
}

export default function EnterHandDialog({ disabled, onEnterHand, rank1Offset, suit1Offset, rank2Offset, suit2Offset }: EnterHandDialogProps) {
    const handForm = useForm<z.infer<typeof handFormSchema>>({
        resolver: zodResolver(handFormSchema),
        defaultValues: {
            rank1: "",
            suit1: "",
            rank2: "",
            suit2: "",
        },
    });

    function handleOpenChange(open: boolean) {
        if (open) {
            handForm.reset({
                rank1: "",
                suit1: "",
                rank2: "",
                suit2: "",
            });
        }
    }

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="my-1" disabled={disabled}>Enter hand (optional)</Button>
            </DialogTrigger>
            <Form {...handForm}>
                <DialogContent className="w-400">
                    <form onSubmit={handForm.handleSubmit(onEnterHand)} className="flex flex-col">
                        <DialogHeader>
                            <DialogTitle>
                                Enter Hand
                            </DialogTitle>
                            <DialogDescription>
                                Fields are shifted every hand to prevent cheating
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex w-full h-full divide-x mt-4">
                            <div className="flex flex-col w-full h-full p-2">
                                <FormLabel className="justify-center">
                                    Card 1
                                </FormLabel>
                                <div className="flex w-full">
                                    <div className="flex flex-col w-full p-2">
                                        <FormField
                                            control={handForm.control}
                                            name="rank1"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <RankSelect onValueChange={field.onChange} offset={rank1Offset} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col w-full p-2">
                                        <FormField
                                            control={handForm.control}
                                            name="suit1"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <SuitSelect onValueChange={field.onChange} offset={suit1Offset} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col w-full h-full p-2">
                                <FormLabel className="justify-center">
                                    Card 2
                                </FormLabel>
                                <div className="flex w-full">
                                    <div className="flex flex-col w-full p-2">
                                        <FormField
                                            control={handForm.control}
                                            name="rank2"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <RankSelect onValueChange={field.onChange} offset={rank2Offset} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col w-full p-2">
                                        <FormField
                                            control={handForm.control}
                                            name="suit2"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <SuitSelect onValueChange={field.onChange} offset={suit2Offset} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="submit">Confirm</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    )
}
