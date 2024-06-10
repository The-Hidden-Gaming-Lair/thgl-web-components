import type { ReactNode } from "react";
import { cn } from "@repo/lib";

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
    return <>{children}</>;
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
      {children}
    </div>
  );
}
