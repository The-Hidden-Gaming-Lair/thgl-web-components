"use client";
import { ReactNode, useState } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { ExternalAnchor } from "../(header)/external-anchor";
import { X } from "lucide-react";

export function AdFreeContainer({
  children,
  className,
  closable,
}: {
  children: ReactNode;
  className?: string;
  closable?: ReactNode;
}): JSX.Element {
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);
  const [closed, setClosed] = useState(false);

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
      {closable && !closed && (
        <button
          type="button"
          className="absolute top-0 right-0 p-1 z-10"
          onClick={() => setClosed(true)}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {!closed && closable}
    </div>
  );
}
