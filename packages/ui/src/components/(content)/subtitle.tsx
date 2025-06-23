import { cn } from "@repo/lib";

export function Subtitle({ title }: { title: string }): JSX.Element {
  return (
    <h2 className="text-lg md:text-xl w-full text-left border-b-2 pb-2">
      <span
        className={cn(
          "inline-block bg-primary rounded w-3 md:w-4 h-3 md:h-4 mr-2",
        )}
      />
      <span>{title}</span>
    </h2>
  );
}
