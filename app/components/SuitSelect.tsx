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

    function defaultColour(suit: string) {
        if (!Card.suits.includes(suit)) return "";

        if (["d", "h"].includes(suit)) {
            return "text-red-500";
        } else {
            return "text-black";
        }
    }

    function activeColour(suit: string) {
        if (!Card.suits.includes(suit)) return "";

        if (["d", "h"].includes(suit)) {
            return "text-red-300";
        } else {
            return "text-white";
        }
    }

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
                            <RadioGroupPrimitive.Item value={e} asChild>
                                <Button className={`${value === e
                                        ? `bg-gray-500 ${activeColour(e)}`
                                        : `bg-white ${defaultColour(e)}`}
                                    border-1 border-gray-200 shadow-xs hover:bg-gray-500 hover:${activeColour(e)} w-20`
                                }>
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
