import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { z } from "zod";
import { vpipFormSchema } from "~/formSchemas";
import { zodResolver } from "@hookform/resolvers/zod";

interface VpipDialogProps {
    disabled: boolean,
    onVpip(data: z.infer<typeof vpipFormSchema>): Promise<void>,
}

export default function VpipDialog({ disabled, onVpip }: VpipDialogProps) {
    const vpipForm = useForm<z.infer<typeof vpipFormSchema>>({
        resolver: zodResolver(vpipFormSchema),
        defaultValues: {
            option: "no",
        },
    });
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="my-1" disabled={disabled}>VPIP</Button>
            </DialogTrigger>
            <Form {...vpipForm}>
                <DialogContent className="w-50 h-45">
                    <form onSubmit={vpipForm.handleSubmit(onVpip)} className="flex flex-col">
                        <DialogHeader className="mb-2">
                            <DialogTitle>
                                VPIP
                            </DialogTitle>
                            <DialogDescription />
                        </DialogHeader>
                        <FormField
                            control={vpipForm.control}
                            name="option"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue="no"
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                <RadioGroupItem value="no" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                No
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                <RadioGroupItem value="yes" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                Yes
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-5">
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