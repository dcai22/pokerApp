import type { Route } from "../+types/root";

export async function loader({ params }: Route.LoaderArgs) {
    const table_id = params.table_id;
    if (!table_id) {
        throw new Response("Not Found", { status: 404 });
    }
    return { table_id };
}

export default function Table({ loaderData }: Route.ComponentProps) {

    return (
        <p>
            Welcome to table {loaderData.table_id}!
        </p>
    );
}
