import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useSettingsStore } from "@repo/lib";
import { HOTKEYS } from "@repo/lib/thgl-app";

export function Hotkey({
  name,
}: {
  name: (typeof HOTKEYS)[keyof typeof HOTKEYS];
}) {
  const hotkeys = useSettingsStore((state) => state.hotkeys);
  const setHotkey = useSettingsStore((state) => state.setHotkey);

  const [recording, setRecording] = useState(false);
  const [currentCombo, setCurrentCombo] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;

    const keysPressed = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      keysPressed.add(e.key.toUpperCase());

      const modifiers: string[] = [];
      if (e.ctrlKey) modifiers.push("CTRL");
      if (e.altKey) modifiers.push("ALT");
      if (e.shiftKey) modifiers.push("SHIFT");

      const key = normalizeKey(e.key);
      if (!["CONTROL", "SHIFT", "ALT"].includes(key)) {
        const combo = [...modifiers.sort(), key].join("+");
        setCurrentCombo(combo);
      }

      // Escape = cancel
      if (e.key === "Escape") {
        setRecording(false);
        setCurrentCombo(null);
      }
    };

    const handleKeyUp = () => {
      if (currentCombo) {
        setHotkey(name, currentCombo);
        setRecording(false);
        setCurrentCombo(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [recording, currentCombo, setHotkey, name]);

  return (
    <Button
      size="sm"
      variant={recording ? "default" : "outline"}
      onClick={() => {
        setRecording(true);
        setCurrentCombo(null);
      }}
    >
      {recording
        ? currentCombo || "Press keys..."
        : hotkeys[name] || "Unassigned"}
    </Button>
  );
}

// Normalize browser keys into your hotkey naming
function normalizeKey(key: string): string {
  switch (key) {
    case " ":
    case "Spacebar":
      return "SPACE";
    case "Esc":
      return "ESCAPE";
    case "ArrowUp":
      return "UP";
    case "ArrowDown":
      return "DOWN";
    case "ArrowLeft":
      return "LEFT";
    case "ArrowRight":
      return "RIGHT";
    default:
      return key.toUpperCase();
  }
}
