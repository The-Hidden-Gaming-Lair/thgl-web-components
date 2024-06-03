import { cn } from "@repo/lib";
import { AdsContainer } from "./ads-container";

export function AdsFallback({ title }: { title: string }): JSX.Element {
  return (
    <AdsContainer title={title} className="right-0 bottom-0">
      <div className={cn("w-[400px] h-[300px] bg-background/50")} />
    </AdsContainer>
  );
}
