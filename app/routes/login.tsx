import { useNavigate } from "react-router";
import axios from "axios";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { API_BASE } from "~/root";

const formSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

export default function Login() {
    const navigate = useNavigate();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    useEffect(() => {
        if (localStorage.getItem("token")) navigate("/joinTable");
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const username = values.username;
        const password = values.password;

        try {
            const res = await axios.post(
                `${API_BASE}/login`,
                {
                    username,
                    password,
                }
            );
            
            if (res.status === 200) {
                localStorage.setItem("token", res.data.token);
                localStorage.setItem("playerId", res.data.player_id)
                navigate("/joinTable");
            } else {
                window.alert("login error");
            }
        } catch (err) {
            window.alert("incorrect username or password");
        }
    }

    return (
        <div className="flex flex-col justify-center items-center w-screen h-screen">
            <div className="flex flex-col">
                <h1>PokerApp login:</h1>

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
                        <Button type="submit" className="mt-2">Login</Button>
                    </form>
                </Form>

                <h1 className="mb-1">Don't have an account?</h1>
                <Button onClick={() => navigate("/register")}>Register an account</Button>
            </div>
        </div>
    );
}