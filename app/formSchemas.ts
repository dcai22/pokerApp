import { Card } from "server/interface";
import { z } from "zod";

export const buyinFormSchema = z.object({
    amount: z.coerce.number({ message: "invalid: please enter a number" }).multipleOf(0.01, { message: "invalid: please enter to the nearest cent" }),
});

export const vpipFormSchema = z.object({
    option: z.enum(["yes", "no"], {
        required_error: "Select one of the options",
    }),
});

export const handFormSchema = z.object({
    rank1: z.enum(["", ...Card.ranks]),
    suit1: z.enum(["", ...Card.suits]),
    rank2: z.enum(["", ...Card.ranks]),
    suit2: z.enum(["", ...Card.suits]),
});
