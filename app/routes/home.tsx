import { useNavigate } from "react-router";
import type { Route } from "./+types/home";
import RandomButton from "~/components/RandomButton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      Welcome to my app!
      <RandomButton />
      <p><button onClick={() => navigate(`/login`)}>get me out</button></p>
    </>
  )
}
