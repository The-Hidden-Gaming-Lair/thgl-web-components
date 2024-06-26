"use client";
import { ReactNode, useEffect, useState } from "react";
import { cn, useAccountStore } from "@repo/lib";
import { ExternalAnchor } from "../(header)/external-anchor";
import { trackEvent } from "../(header)";

export function AdFreeContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const [isClosed, setIsClosed] = useState(false);
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  useEffect(() => {
    if (!isClosed) {
      return;
    }
    trackEvent("Ad Closed");

    const closedAt = Date.now();
    let timeLeftToRestore = 1000 * 60 * 45;
    let timeoutId: NodeJS.Timeout | null = null;
    const startTimeout = () => {
      const now = Date.now();
      const timeSinceClosed = now - closedAt;
      timeLeftToRestore = timeLeftToRestore - timeSinceClosed;
      console.log(`Restore ad in ${timeLeftToRestore / 1000} seconds`);

      timeoutId = setTimeout(() => {
        setIsClosed(false);
        trackEvent("Ad Restored");
      }, timeLeftToRestore);
    };
    startTimeout();
    const handleVisibilityChange = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (!document.hidden) {
        startTimeout();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isClosed]);

  if (isClosed || !children) {
    return <></>;
  }

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
