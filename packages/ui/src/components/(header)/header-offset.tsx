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
  if (bypass) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }
  return (
    <div
      className={cn(
        "relative pt-[54px] md:pl-[77px]",
        {
          "h-dscreen": full,
        },
        className,
      )}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  );
}
