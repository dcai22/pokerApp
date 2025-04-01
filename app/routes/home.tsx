import type { Route } from "./+types/home";
import RandomButton from "~/components/RandomButton";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      Welcome to my app!
      <RandomButton />
    </>
  )
}
