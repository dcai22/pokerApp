import { Card } from "server/interface";
import { FormControl, FormItem, FormLabel } from "./ui/form";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { shiftArray } from "~/helpers";

interface SuitSelectProps {
    onValueChange: ((value: string) => void) | undefined,
    offset: number,
}

export default function SuitSelect({ onValueChange, offset }: SuitSelectProps) {
    return (
        <RadioGroup
            onValueChange={onValueChange}
            defaultValue=""
            className="flex flex-col space-y-1"
        >
            {shiftArray(Card.suits, offset)
                .map((e, i) => 
                    <FormItem className="flex items-center space-x-3 space-y-0" key={i}>
                        <FormControl>
                            <RadioGroupItem value={e} />
                        </FormControl>
                        <FormLabel className={`font-normal ${["d", "h"].includes(e) ? "text-red-500" : "text-black" }`}>
                            {Card.prettySuit(e)}
                        </FormLabel>
                    </FormItem>
                )
            }
        </RadioGroup>
    );
}
