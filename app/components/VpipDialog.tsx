import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem } from "./ui/form";
import { RadioGroup } from "./ui/radio-group";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
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

    function handleOpenChange(open: boolean) {
        if (open) {
            vpipForm.reset({ option: "no" });
        }
    }

    return (
        <Dialog onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="my-1" disabled={disabled}>VPIP</Button>
            </DialogTrigger>
            <Form {...vpipForm}>
                <DialogContent className="flex w-60 h-45 items-center">
                    <form onSubmit={vpipForm.handleSubmit(onVpip)} className="flex flex-col w-full">
                        <DialogHeader className="mb-2 items-center">
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
                                            defaultValue={field.value}
                                            className="flex"
                                        >
                                            <FormItem className="flex items-center space-y-0">
                                                <FormControl className="checked:bg-black">
                                                    <RadioGroupPrimitive.Item value="no" asChild>
                                                        <Button className={`${field.value === "no" ? "bg-gray-500 text-white" : "bg-white text-gray-500"} border-1 border-gray-200 shadow-xs hover:bg-gray-500 hover:text-white w-22`}>
                                                            No
                                                        </Button>
                                                    </RadioGroupPrimitive.Item>
                                                </FormControl>
                                            </FormItem>
                                            <FormItem className="flex items-center space-y-0">
                                                <FormControl className="checked:bg-black">
                                                    <RadioGroupPrimitive.Item value="yes" asChild>
                                                        <Button className={`${field.value === "yes" ? "bg-gray-500 text-white" : "bg-white text-gray-500"} border-1 border-gray-200 shadow-xs hover:bg-gray-500 hover:text-white w-22`}>
                                                            Yes
                                                        </Button>
                                                    </RadioGroupPrimitive.Item>
                                                </FormControl>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-5 w-full">
                            <DialogClose asChild>
                                <Button type="submit" className="w-full">Confirm</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    )
}