"use client";
import { cn, useSettingsStore } from "@repo/lib";
import { useEffect, useState } from "react";

export function PaliaTime() {
  const [timeFormated, setTimeFormated] = useState("");
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const overlayMode = useSettingsStore((state) => state.overlayMode);

  useEffect(() => {
    const interval = setInterval(() => {
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
    }, 300);
    return () => {
      clearInterval(interval);
    };
  }, []);

  if (lockedWindow) {
    return (
      <div
        className={cn(
          "fixed z-[9999] flex gap-3",
          !overlayMode ? "right-2 top-1" : "top-2 left-28",
        )}
      >
        <div className={cn("w-full text-left flex gap-2 justify-between")}>
          <span>Palia Time</span>
          <span>{timeFormated}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full text-left flex gap-2 justify-between py-2 px-4")}
    >
      <span>Palia Time</span>
      <span>{timeFormated}</span>
    </div>
  );
}
