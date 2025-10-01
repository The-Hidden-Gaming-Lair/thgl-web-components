"use client";
import { useGameState } from "@repo/lib";
import { Button } from "../(controls)";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function PlayerDetails() {
  const player = useGameState((state) => state.player);

  const value = player && `(${Math.round(player.y)},${Math.round(player.x)})`;
  return (
    <div className="p-2 flex justify-between items-center">
      <p>Player Position: {value || "Waiting..."}</p>
      <Button
        size="icon"
        variant="secondary"
        disabled={!value}
        className="h-7 w-7"
        onClick={() => {
          if (!value) {
            return;
          }
          navigator.clipboard.writeText(value);
          toast("Copied to clipboard");
        }}
      >
        <Copy className="w-3 h-3" />
      </Button>
    </div>
  );
}
