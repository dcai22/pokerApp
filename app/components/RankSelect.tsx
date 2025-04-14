import { Card } from "server/interface";
import { FormControl, FormItem, FormLabel } from "./ui/form";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

interface RankSelectProps {
    onValueChange: ((value: string) => void) | undefined,
}

export default function RankSelect({ onValueChange }: RankSelectProps) {
    return (
        <RadioGroup
            onValueChange={onValueChange}
            defaultValue=""
            className="flex flex-col space-y-1"
        >
            {Card.ranks.map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value)
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
