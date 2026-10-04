import type { ReactNode, JSX } from "react";
import { cn } from "@repo/lib";
import { ErrorBoundary, ScrollArea } from "../(controls)";
import { FooterSlot } from "./footer-slot";

export function HeaderOffset({
  children,
  className,
  full,
  bypass,
}: {
  children: ReactNode;
  className?: string;
  full?: boolean;
  bypass?: boolean;
}): JSX.Element {
  return (
    <ScrollArea
      className={cn(
        "relative",
        {
          "pt-[54px]": !bypass,
          "h-dscreen lock": full,
        },
        className,
      )}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
      {!bypass && <FooterSlot />}
    </ScrollArea>
  );
}
