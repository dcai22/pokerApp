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
    rank1Randomiser: number[],
    suit1Randomiser: number[],
    rank2Randomiser: number[],
    suit2Randomiser: number[],
}

export default function EnterHandDialog({ disabled, onEnterHand, rank1Randomiser, suit1Randomiser, rank2Randomiser, suit2Randomiser }: EnterHandDialogProps) {
    const handForm = useForm<z.infer<typeof handFormSchema>>({
        resolver: zodResolver(handFormSchema),
        defaultValues: {
            rank1: "",
            suit1: "",
            rank2: "",
            suit2: "",
        },
    });

    return (
        <Dialog>
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
                                Fields are randomised every hand to prevent cheating
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex w-full h-full">
                            <div className="flex flex-col w-full">
                                <FormLabel className="my-4">
                                    1. Rank
                                </FormLabel>
                                <FormField
                                    control={handForm.control}
                                    name="rank1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <RankSelect onValueChange={field.onChange} randomiser={rank1Randomiser} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col w-full">
                                <FormLabel className="my-4">
                                    Suit
                                </FormLabel>
                                <FormField
                                    control={handForm.control}
                                    name="suit1"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <SuitSelect onValueChange={field.onChange} randomiser={suit1Randomiser} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col w-full">
                                <FormLabel className="my-4">
                                    2. Rank
                                </FormLabel>
                                <FormField
                                    control={handForm.control}
                                    name="rank2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <RankSelect onValueChange={field.onChange} randomiser={rank2Randomiser} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col w-full">
                                <FormLabel className="my-4">
                                    Suit
                                </FormLabel>
                                <FormField
                                    control={handForm.control}
                                    name="suit2"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <SuitSelect onValueChange={field.onChange} randomiser={suit2Randomiser} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
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
