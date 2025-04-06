import type { Table } from "server/interface";

interface TableWelcomeProps {
    name: string,
    code: number,
}

export default function TableWelcome({ name, code }: TableWelcomeProps) {
    return (
        <div className="mb-10">
            <h1>Welcome to <span className="font-bold">{name}</span>!</h1>
            <h1>Join code: <span className="font-bold">{code}</span></h1>
        </div>
    )
}