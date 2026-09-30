"use client";
import { cn, useSettingsStore } from "@repo/lib";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { PaliaClock } from "./palia-clock";

// Live in-game clock (1 real hour = 1 Palia day), formatted "h:mm AM/PM".
// Shared by the locked-window PaliaTime overlay and the Active Worlds row.
// The event schedule behind the clock popover lives in palia-clock.ts.
export function usePaliaTime() {
  const [timeFormated, setTimeFormated] = useState("");

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const realSeconds = Math.floor(now / 1000) % 3600;
      const paliaSeconds = realSeconds * 24;

      let hours = Math.floor(paliaSeconds / 3600);
      const minutes = Math.floor((paliaSeconds % 3600) / 60);
      const period = hours >= 12 ? "PM" : "AM";
      if (hours === 0) {
        hours = 12;
      } else if (hours > 12) {
        hours -= 12;
      }

      setTimeFormated(`${hours}:${String(minutes).padStart(2, "0")} ${period}`);
    };
    update();
    const interval = setInterval(update, 300);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return timeFormated;
}

// Pill next to the floating "Filters" button (filterBarComponents): the clock
// and its event timetable stay reachable with the filter panel hidden. A click
// keeps the timetable open while the map is used.
export function PaliaClockButton() {
  const timeFormated = usePaliaTime();
  return (
    <PaliaClock
      persistent
      className="mx-0 h-8 min-w-0 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent"
    >
      <Clock className="h-3.5 w-3.5" />
      {timeFormated}
    </PaliaClock>
  );
}

export function PaliaTime() {
  const timeFormated = usePaliaTime();
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const overlayMode = useSettingsStore((state) => state.overlayMode);

  if (lockedWindow) {
    return (
      <div
        className={cn(
          "fixed z-9999 flex gap-3",
          !overlayMode ? "right-2 top-1" : "top-2 left-28",
        )}
      >
        <div className={cn("w-full text-left flex gap-2 justify-between")}>
          <span>Palia Time</span>
          {/* Locked window: plain readout, nothing to hover or click. */}
          <PaliaClock disabled>{timeFormated}</PaliaClock>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full text-left flex gap-2 justify-between py-2 px-4")}
    >
      <span>Palia Time</span>
      <PaliaClock>{timeFormated}</PaliaClock>
    </div>
  );
}
