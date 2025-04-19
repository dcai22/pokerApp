import { Card } from "server/interface";
import { FormControl, FormItem } from "./ui/form";
import { RadioGroup } from "./ui/radio-group";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { shiftArray } from "~/helpers";
import { useState } from "react";
import { Button } from "./ui/button";

interface SuitSelectProps {
    onValueChange: ((value: string) => void),
    offset: number,
}

export default function SuitSelect({ onValueChange, offset }: SuitSelectProps) {
    const [value, setValue] = useState("");

    return (
        <RadioGroup
            onValueChange={(v) => {
                setValue(v);
                onValueChange(v);
            }}
            defaultValue=""
            className="flex flex-col space-y-1 gap-1"
        >
            {shiftArray(Card.suits, offset)
                .map((e, i) =>
                    <FormItem className="flex items-center space-x-3 space-y-0" key={i}>
                        <FormControl className="checked:bg-black">
                            <RadioGroupPrimitive.Item value={e}>
                                <Button className={` ${["d", "h"].includes(e) ? "text-red-500" : "text-black"} ${value === e ? "bg-gray-500 text-white" : "bg-white"} border-1 border-gray-200 shadow-xs hover:bg-gray-500 hover:text-white w-15`}>
                                    {Card.prettySuit(e)}
                                </Button>
                            </RadioGroupPrimitive.Item>
                        </FormControl>
                    </FormItem>
                )
            }
        </RadioGroup>
    );
}
