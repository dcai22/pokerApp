interface GreetingProps {
    name: string,
}

export default function Greeting({ name }: GreetingProps) {
    return (
        <div className="mb-4">
            Hi <span className="font-bold underline">{name}</span>!
        </div>
    );
}