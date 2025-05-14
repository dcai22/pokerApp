import { Card } from "server/interface";
import { FormControl, FormItem } from "./ui/form";
import { RadioGroup } from "./ui/radio-group";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { shiftArray } from "~/helpers";
import { useState } from "react";
import { Button } from "./ui/button";

interface SuitSelectProps {
    onValueChange(value: string): void,
    offset: number,
}

export default function SuitSelect({ onValueChange, offset }: SuitSelectProps) {
    const [value, setValue] = useState("");

    const defaultRed = "text-red-500";
    const activeRed = "text-red-300";
    const defaultBlack = "text-black";
    const activeBlack = "text-gray-300";

    function isRed(suit: string) {
        if (["d", "h"].includes(suit)) return true;
        return false;
    }

    function defaultColour(suit: string) {
        return isRed(suit) ? defaultRed : defaultBlack;
    }

    function activeColour(suit: string) {
        return isRed(suit) ? activeRed : activeBlack;
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
                                        : `bg-white ${defaultColour(e)}`
                                    } border-1 border-gray-200 shadow-xs hover:bg-gray-500 w-full
                                    ${isRed(e) ? `hover:${activeRed}` : `hover:${activeBlack}`}`
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
