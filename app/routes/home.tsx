import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import RandomButton from "~/components/RandomButton";
import { Button } from "~/components/ui/button";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen">
      <div className="flex flex-col w-50">
        <div className="flex justify-center mb-10">Welcome to my app!</div>
        <div className="mb-10"><RandomButton /></div>
        <Button onClick={() => navigate(`/login`)}>get me out</Button>
      </div>
    </div>
  )
}
