import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect } from "react";
import { genHash } from "~/helpers";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";

const formSchema = z.object({
    username: z.string().min(1, { message: "*required field" }),
    password: z.string().min(1, { message: "*required field" }),
});

// TODO: error message from loaderData
export default function Register() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    useEffect(() => {
        if (sessionStorage.getItem("token")) navigate("/joinTable");
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const username = values.username;
        const password = values.password;

        const hashedPassword = await genHash(password);
        try {
            const res = await axios.post(
                "http://localhost:3000/registerPlayer",
                {
                    username,
                    hashedPassword,
                }
            );
            if (res.status === 200) {
                sessionStorage.setItem("token", res.data.token);
                sessionStorage.setItem("playerId", res.data.player_id);
                navigate("/joinTable");
            } else {
                window.alert("register error");
            }
        } catch (err) {
            window.alert("username is taken")
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <h1>Register a PokerApp account:</h1>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col mb-10">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel />
                                    <FormControl>
                                        <Input placeholder="Username" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel />
                                    <FormControl>
                                        <Input placeholder="Password" type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="mt-2">Register</Button>
                    </form>
                </Form>

                <h1 className="mb-1">Already have an account?</h1>
                <Button onClick={() => navigate("/login")}>Login here</Button>
            </div>
        </div>
    );
}
