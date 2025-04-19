import { Card } from "server/interface";
import { FormControl, FormItem, FormLabel } from "./ui/form";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { shiftArray } from "~/helpers";

interface RankSelectProps {
    onValueChange: ((value: string) => void) | undefined,
    offset: number,
}

export default function RankSelect({ onValueChange, offset }: RankSelectProps) {
    return (
        <RadioGroup
            onValueChange={onValueChange}
            defaultValue=""
            className="flex flex-col space-y-1"
        >
            {shiftArray(Card.ranks, offset)
                .map((e, i) => 
                    <FormItem className="flex items-center space-x-3 space-y-0" key={i}>
                        <FormControl>
                            <RadioGroupItem value={e} />
                        </FormControl>
                        <FormLabel className="font-normal">
                            {e}
                        </FormLabel>
                    </FormItem>
                )
            }
        </RadioGroup>
    );
}
