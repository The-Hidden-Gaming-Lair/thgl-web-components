"use client";

import { ReactNode, useState } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { ExternalAnchor } from "../(header)/external-anchor";
import { X } from "lucide-react";
import { useT } from "../(providers)";

export function AdFreeContainer({
  children,
  className,
  closable,
}: {
  children: ReactNode;
  className?: string;
  closable?: ReactNode;
}): JSX.Element {
  const t = useT();
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);
  const [closed, setClosed] = useState(false);

  return (
    <div
      className={cn(
        "relative pointer-events-auto shrink-0 border overflow-hidden bg-card text-card-foreground shadow rounded-none md:rounded-md",
        className,
      )}
    >
      <div
        // href="https://www.th.gl/support-me"
        className="block text-center text-xs p-0.5 group cursor-pointer"
        onClick={() => {
          setShowUserDialog(true);
          window.open("https://www.th.gl/support-me", "_blank");
        }}
      >
        {t.rich("adfree.linkText", {
          components: {
            "ad-free": (
              <span className="text-primary group-hover:underline">
                {t("adfree.linkTextAdFree")}
              </span>
            ),
          },
        })}
      </div>
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
