import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { cn } from "@repo/lib";

export function HeaderLink({
  children,
  active,
}: {
  children: ReactNode;
  active: boolean;
}): JSX.Element {
  return (
    <Button
      asChild
      variant="link"
      className={cn(
        "flex whitespace-nowrap items-center gap-1 px-2 py-1 hover:text-primary transition-colors text-secondary-foreground",
        {
          "text-primary": active,
        },
      )}
    >
      {children}
    </Button>
  );
}
