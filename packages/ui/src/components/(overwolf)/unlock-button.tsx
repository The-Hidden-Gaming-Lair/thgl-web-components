import { EyeOpenIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "@repo/lib";
import { Hotkey } from "./hotkey";
import { HOTKEYS } from "@repo/lib/overwolf";

export function UnlockButton({
  onClick,
  gameClassId,
}: {
  onClick: () => void;
  gameClassId: number;
}) {
  const [timeLeft, setTimeLeft] = useState(10);

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
        "lock fixed p-2 z-10 flex gap-2 items-center",
        hintVisible ? "border-neutral-800 bg-zinc-800/30" : ""
      )}
    >
      <Button
        size="icon"
        onClick={onClick}
        className={cn(
          "transition-all",
          hintVisible ? "bg-white" : "bg-white/10 text-white hover:bg-white/40"
        )}
      >
        <EyeOpenIcon />
      </Button>
      {hintVisible && (
        <>
          <p className="text-xl font-bold">
            Click the eye to show the controls or hit
          </p>
          <Hotkey name={HOTKEYS.TOGGLE_LOCK_APP} gameClassId={gameClassId} />(
          {timeLeft})
        </>
      )}
    </div>
  );
}
