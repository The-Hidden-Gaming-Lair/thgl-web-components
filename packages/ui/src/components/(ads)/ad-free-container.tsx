"use client";
import { ReactNode, useEffect, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { cn } from "@repo/lib";
import { ExternalAnchor } from "../(header)/external-anchor";
import { trackEvent } from "../(header)";

export function AdFreeContainer({
  children,
  closable,
  className,
}: {
  children: ReactNode;
  closable?: boolean;
  className?: string;
}): JSX.Element {
  const [isClosed, setIsClosed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (timeLeft < 1 || !closable) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [timeLeft, closable]);

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
        className
      )}
    >
      <ExternalAnchor
        href="https://www.th.gl/support-me"
        className="block text-center text-xs p-0.5 group"
      >
        Get <span className="text-primary group-hover:underline">AD-Free</span>
      </ExternalAnchor>
      {closable && (
        <button
          className={cn(
            "absolute top-0.5 right-0.5 font-mono text-xs font-bold",
            {
              "hover:text-primary": timeLeft < 1,
            }
          )}
          disabled={timeLeft >= 1}
          onClick={() => setIsClosed(true)}
        >
          {timeLeft ? <span className="mr-1">{timeLeft}</span> : <Cross2Icon />}
        </button>
      )}
      {children}
    </div>
  );
}
