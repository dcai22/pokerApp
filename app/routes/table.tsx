import type { Route } from "../+types/root";

export async function loader({ params }: Route.LoaderArgs) {
    const username = params.username;
    // TODO: use table_id instead of name
    const name = params.name;
    if (!name) {
        throw new Response("Not Found", { status: 404 });
    }
    return { username, name };
}

export default function Table({ loaderData }: Route.ComponentProps) {

    return (
        <>
            Hi {loaderData.username},<br />
            Welcome to table {loaderData.name}!<br />
        </>
    );
}
