"use client";
import { ReactNode } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { ExternalAnchor } from "../(header)/external-anchor";

export function AdFreeContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  return (
    <div
      className={cn(
        "relative pointer-events-auto shrink-0 border overflow-hidden bg-card text-card-foreground shadow rounded-none md:rounded-md",
        className,
      )}
    >
      <ExternalAnchor
        href="https://www.th.gl/support-me"
        className="block text-center text-xs p-0.5 group"
        onClick={() => setShowUserDialog(true)}
      >
        Get <span className="text-primary group-hover:underline">AD-Free</span>
      </ExternalAnchor>
      {children}
    </div>
  );
}
