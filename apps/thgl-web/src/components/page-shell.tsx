import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export type PageShellProps = ComponentPropsWithoutRef<"section">;

export function PageShell({ className, ...props }: PageShellProps) {
  return (
    <section
      className={cn("space-y-8 px-4 pt-10 pb-20 mx-auto", className)}
      {...props}
    />
  );
}
