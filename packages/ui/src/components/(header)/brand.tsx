import { cn } from "@repo/lib";

export function Brand({
  title,
  className,
}: {
  title: string;
  className?: string;
}): JSX.Element {
  return (
    <h1
      className={cn(
        "text-lg md:text-2xl md:leading-6 font-extrabold tracking-tight whitespace-nowrap",
        className,
      )}
    >
      {title.replaceAll(" ", "").toUpperCase()}
      <span className={cn("text-xs text-gray-400 hidden min-[410px]:inline")}>
        .TH.GL
      </span>
    </h1>
  );
}
