import { cn } from "@repo/lib";

interface SubtitleProps {
  title: string;
  order?: 2 | 3 | 4 | 5 | 6;
}

export function Subtitle({ title, order = 2 }: SubtitleProps): JSX.Element {
  const Tag = `h${order}` as keyof JSX.IntrinsicElements;

  const styleByOrder = {
    2: "text-xl md:text-2xl pb-2 border-b-2",
    3: "text-lg md:text-xl pb-1 border-b",
    4: "text-base md:text-lg pb-1 border-b",
    5: "text-base pb-0.5",
    6: "text-sm",
  };

  return (
    <Tag className={cn("w-full text-left", styleByOrder[order])}>
      <span
        className={cn(
          "inline-block bg-primary rounded w-3 md:w-4 h-3 md:h-4 mr-2",
        )}
      />
      <span>{title}</span>
    </Tag>
  );
}
