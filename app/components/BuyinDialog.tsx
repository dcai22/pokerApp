import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { Input } from "./ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buyinFormSchema } from "~/formSchemas";

interface BuyinDialogProps {
    onBuyin(value: z.infer<typeof buyinFormSchema>): Promise<void>,
}

export default function BuyinDialog({ onBuyin }: BuyinDialogProps) {
    const buyinForm = useForm<z.infer<typeof buyinFormSchema>>({
        resolver: zodResolver(buyinFormSchema),
        defaultValues: {
            amount: 25,
        },
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="my-2">Buyin</Button>
            </DialogTrigger>
            <Form {...buyinForm}>
                <DialogContent className="w-60">
                    <form onSubmit={buyinForm.handleSubmit(onBuyin)} className="flex flex-col">
                        <DialogHeader className="mb-1">
                            <DialogTitle>
                                Buyin
                            </DialogTitle>
                            <DialogDescription>
                                Enter an amount to buyin:
                            </DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={buyinForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="e.g. 25" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-2">
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