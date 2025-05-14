import axios from "axios";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { API_BASE } from "~/root";
import { useNavigate } from "react-router";

interface deleteAccountButtonProps {
    playerId: number,
    onSubmit(): void,
}

export default function deleteAccountButton({ playerId, onSubmit }: deleteAccountButtonProps) {
    const navigate = useNavigate();

    async function handleClick() {
        onSubmit();
        try {
            await axios.delete(
                `${API_BASE}/removePlayer?playerId=${playerId}`
            );
        } catch (err) {
            console.log(err);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("playerId");
            navigate("/login");
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="fixed top-5 left-5">Delete Account</Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col w-70 h-50">
                <DialogHeader>
                    <DialogTitle className="text-red-500 text-3xl">
                        Are you sure?
                    </DialogTitle>
                    <DialogDescription className="flex text-red-500">
                        <span>⚠</span>
                        <span>All data from you and any table you own will be deleted</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex w-full h-full justify-center items-center">
                    <Button onClick={handleClick} className="bg-red-400 hover:bg-red-500 text-white w-1/3">Yes</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}