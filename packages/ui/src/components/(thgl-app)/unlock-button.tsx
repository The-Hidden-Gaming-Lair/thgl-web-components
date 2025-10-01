"use client";
import { EyeOpenIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@repo/lib";
import { postWebviewMessage } from "@repo/lib/thgl-app";

export function UnlockButton({ onClick }: { onClick: () => void }) {
  const [timeLeft, setTimeLeft] = useState(9);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [timeLeft]);

  const hintVisible = timeLeft > 0;
  return (
    <div
      className={cn(
        "lock fixed p-1 z-[99999] flex gap-2 items-center",
        hintVisible ? "border-neutral-800 bg-zinc-800/30" : "",
      )}
    >
      <Button
        size="xs-icon"
        onClick={onClick}
        className={cn(
          "transition-all",
          hintVisible ? "bg-white" : "bg-white/10 text-white hover:bg-white/40",
        )}
        onMouseEnter={() => {
          postWebviewMessage({
            action: "clickthroughOverlayWebView",
            payload: {
              clickthrough: false,
            },
          });
        }}
        onMouseLeave={() => {
          postWebviewMessage({
            action: "clickthroughOverlayWebView",
            payload: {
              clickthrough: true,
            },
          });
        }}
      >
        <EyeOpenIcon />
      </Button>
      {hintVisible && (
        <>
          <p className="text-sm font-bold">
            Click the eye to show the controls again
          </p>
          <span className="text-sm">{timeLeft}</span>
        </>
      )}
    </div>
  );
}
