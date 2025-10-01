import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { useSettingsStore } from "@repo/lib";
import { HOTKEYS } from "@repo/lib/thgl-app";

export function Hotkey({
  name,
  isActive,
  onStart,
  onStop,
  onClear,
}: {
  name: (typeof HOTKEYS)[keyof typeof HOTKEYS];
  isActive?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onClear?: () => void;
}) {
  const hotkeys = useSettingsStore((state) => state.hotkeys);
  const setHotkey = useSettingsStore((state) => state.setHotkey);

  const [recording, setRecording] = useState(false);
  const [currentCombo, setCurrentCombo] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const gamepadPrevPressedRef = useRef<boolean[]>([]);

  useEffect(() => {
    const active = isActive ?? recording;
    if (!active) return;

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
        onStop?.();
        setRecording(false);
        setCurrentCombo(null);
      }
    };

    const handleKeyUp = () => {
      if (currentCombo) {
        setHotkey(name, currentCombo);
        onStop?.();
        setRecording(false);
        setCurrentCombo(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Gamepad capture via Gamepad API while recording
    const pollGamepad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < (pads?.length ?? 0); i++) {
        const pad = pads?.[i];
        if (!pad) continue;

        // Buttons: detect first newly pressed button
        for (let b = 0; b < pad.buttons.length; b++) {
          const btn = pad.buttons[b];
          const wasPressed = (gamepadPrevPressedRef.current as any)[`${i}:${b}`] === true;
          const nowPressed = !!btn.pressed || btn.value > 0.5;
          if (!wasPressed && nowPressed) {
            const btnName = mapGamepadButtonToName(b);
            if (btnName) {
              setHotkey(nameArg(), btnName);
              onStop?.();
              setRecording(false);
              setCurrentCombo(null);
              return; // stop on first detection
            }
          }
          (gamepadPrevPressedRef.current as any)[`${i}:${b}`] = nowPressed;
        }

        // D-pad sometimes maps as axes; but standard mapping uses buttons 12-15.
      }
      rafRef.current = requestAnimationFrame(pollGamepad);
    };
    const nameArg = () => name; // stable capture for TS
    rafRef.current = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, recording, currentCombo, setHotkey, name]);

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={(isActive ?? recording) ? "default" : "outline"}
        onClick={() => {
          if (!(isActive ?? recording)) {
            onStart?.();
            setRecording(true);
            setCurrentCombo(null);
          } else {
            onStop?.();
            setRecording(false);
            setCurrentCombo(null);
          }
        }}
      >
        {(isActive ?? recording)
          ? currentCombo || "Press keys or gamepad..."
          : hotkeys[name] || "Unassigned"}
      </Button>
      <Button
        size="xs-icon"
        variant="ghost"
        aria-label="Clear hotkey"
        title="Clear hotkey"
        onClick={() => {
          setHotkey(name, undefined as any);
          onStop?.();
          setRecording(false);
          setCurrentCombo(null);
          onClear?.();
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// Normalize browser keys into your hotkey naming
function normalizeKey(key: string): string {
  // Normalize common keys and special characters to native names
  switch (key) {
    // whitespace / escape
    case " ":
    case "Spacebar":
    case "Space":
      return "SPACE";
    case "Esc":
    case "Escape":
      return "ESCAPE";

    // arrows
    case "ArrowUp":
      return "UP";
    case "ArrowDown":
      return "DOWN";
    case "ArrowLeft":
      return "LEFT";
    case "ArrowRight":
      return "RIGHT";

    // navigation
    case "Tab":
      return "TAB";
    case "Enter":
      return "ENTER";
    case "Backspace":
      return "BACKSPACE";
    case "Delete":
      return "DELETE";
    case "Insert":
      return "INSERT";
    case "Home":
      return "HOME";
    case "End":
      return "END";
    case "PageUp":
      return "PAGEUP";
    case "PageDown":
      return "PAGEDOWN";

    // OEM/special characters
    case "[":
    case "{":
      return "LBRACKET";
    case "]":
    case "}":
      return "RBRACKET";
    case ";":
      return "SEMICOLON";
    case "'":
      return "QUOTE";
    case "/":
      return "SLASH";
    case "\\":
      return "BACKSLASH";
    case ",":
      return "COMMA";
    case ".":
      return "PERIOD";
    case "-":
      return "MINUS";
    case "=":
    case "+":
      return "PLUS"; // consistent with native
    case "`":
    case "~":
      return "TILDE";

    default:
      return key.toUpperCase();
  }
}

// Map standard Gamepad API button index to our names
function mapGamepadButtonToName(index: number): string | null {
  switch (index) {
    case 0:
      return "GAMEPAD_A";
    case 1:
      return "GAMEPAD_B";
    case 2:
      return "GAMEPAD_X";
    case 3:
      return "GAMEPAD_Y";
    case 4:
      return "GAMEPAD_LEFT_SHOULDER";
    case 5:
      return "GAMEPAD_RIGHT_SHOULDER";
    case 6:
      return "GAMEPAD_LEFT_TRIGGER"; // treated as button when pressed
    case 7:
      return "GAMEPAD_RIGHT_TRIGGER";
    case 8:
      return "GAMEPAD_BACK";
    case 9:
      return "GAMEPAD_START";
    case 10:
      return "GAMEPAD_LEFT_THUMB";
    case 11:
      return "GAMEPAD_RIGHT_THUMB";
    case 12:
      return "GAMEPAD_DPAD_UP";
    case 13:
      return "GAMEPAD_DPAD_DOWN";
    case 14:
      return "GAMEPAD_DPAD_LEFT";
    case 15:
      return "GAMEPAD_DPAD_RIGHT";
    default:
      return null;
  }
}
