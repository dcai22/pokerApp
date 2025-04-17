import { z } from "zod";

export const buyinFormSchema = z.object({
    amount: z.coerce.number({ message: "invalid: please enter a number" }).multipleOf(0.01, { message: "invalid: please enter to the nearest cent" }),
});
