import { cn } from "@repo/lib";

export function PageTitle({ title }: { title: string }): JSX.Element {
  return <h1 className={cn("sr-only")}>{title}</h1>;
}
