import { Card } from "server/interface";
import { FormControl, FormItem } from "./ui/form";
import { RadioGroup } from "./ui/radio-group";
import { shiftArray } from "~/helpers";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Button } from "./ui/button";
import { useState } from "react";

interface RankSelectProps {
    onValueChange(value: string): void,
    offset: number,
}

export default function RankSelect({ onValueChange, offset }: RankSelectProps) {
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
            {shiftArray(Card.ranks, offset)
                .map((e, i) => 
                    <FormItem className="flex items-center space-x-3 space-y-0" key={i}>
                        <FormControl className="checked:bg-black">
                            <RadioGroupPrimitive.Item value={e} asChild>
                                <Button className={`${value === e ? "bg-gray-500 text-white" : "bg-white text-gray-500"} border-1 border-gray-200 shadow-xs hover:bg-gray-500 hover:text-white w-full`}>
                                    {e}
                                </Button>
                            </RadioGroupPrimitive.Item>
                        </FormControl>
                    </FormItem>
                )
            }
        </RadioGroup>
    );
}
