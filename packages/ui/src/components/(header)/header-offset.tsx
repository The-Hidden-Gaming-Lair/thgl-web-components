import type { ReactNode } from "react";
import { cn } from "@repo/lib";
import { ErrorBoundary } from "../(controls)";

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
    <div
      className={cn(
        "relative",
        {
          "pt-[54px] md:pl-[77px]": !bypass,
          "h-dscreen lock": full,
        },
        className,
      )}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  );
}
