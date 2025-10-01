"use client";
import { useSettingsStore } from "@repo/lib";
import { postWebviewMessage } from "@repo/lib/thgl-app";
import { useEffect, useRef } from "react";

type WebviewKeyboardEvent = {
  type: "keyboard";
  msg: number;
  wParam: number;
  lParam: number;
  char?: string;
};

const WM_KEYDOWN = 0x0100;
const WM_KEYUP = 0x0101;
const WM_CHAR = 0x0102;
const WM_SYSKEYDOWN = 0x0104;
const WM_SYSKEYUP = 0x0105;

const virtualKeyMap: Record<number, string> = {
  0x08: "Backspace",
  0x09: "Tab",
  0x0d: "Enter",
  0x10: "Shift",
  0x11: "Control",
  0x12: "Alt",
  0x13: "Pause",
  0x14: "CapsLock",
  0x1b: "Escape",
  0x20: " ",
  0x21: "PageUp",
  0x22: "PageDown",
  0x23: "End",
  0x24: "Home",
  0x25: "ArrowLeft",
  0x26: "ArrowUp",
  0x27: "ArrowRight",
  0x28: "ArrowDown",
  0x2e: "Delete",
  0x30: "0",
  0x31: "1",
  0x32: "2",
  0x33: "3",
  0x34: "4",
  0x35: "5",
  0x36: "6",
  0x37: "7",
  0x38: "8",
  0x39: "9",
  0x41: "a",
  0x42: "b",
  0x43: "c",
  0x44: "d",
  0x45: "e",
  0x46: "f",
  0x47: "g",
  0x48: "h",
  0x49: "i",
  0x4a: "j",
  0x4b: "k",
  0x4c: "l",
  0x4d: "m",
  0x4e: "n",
  0x4f: "o",
  0x50: "p",
  0x51: "q",
  0x52: "r",
  0x53: "s",
  0x54: "t",
  0x55: "u",
  0x56: "v",
  0x57: "w",
  0x58: "x",
  0x59: "y",
  0x5a: "z",
};

export function OverlayInputEvents() {
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lockedWindow) {
      postWebviewMessage({
        action: "clickthroughOverlayWebView",
        payload: {
          clickthrough: true,
        },
      }).catch(() => {});
    }
  }, [lockedWindow]);

  // On first load, send initial clickthrough state based on whether the cursor
  // is already hovering the overlay container (same logic as mouse enter/leave).
  useEffect(() => {
    if (lockedWindow) return;
    const el = containerRef.current;
    if (!el) return;
    try {
      const hoveredPath = Array.from(document.querySelectorAll(":hover"));
      const hovered = hoveredPath.some(
        (n) =>
          n === el ||
          el.contains(n) ||
          (n.classList.contains("fixed") && n.classList.contains("inset-0")),
      );
      postWebviewMessage({
        action: "clickthroughOverlayWebView",
        payload: {
          clickthrough: hovered,
        },
      });
    } catch {}
  }, [lockedWindow]);

  // Recovery mechanism: periodically check if mouse state matches clickthrough state
  useEffect(() => {
    if (lockedWindow) return;

    const checkInterval = setInterval(() => {
      const el = containerRef.current;
      if (!el) return;

      try {
        // Check if element or its children are hovered
        const hoveredElements = document.querySelectorAll(":hover");
        const isHovered = Array.from(hoveredElements).some(
          (elem) =>
            elem === el ||
            el.contains(elem) ||
            (elem.classList.contains("fixed") &&
              elem.classList.contains("inset-0")),
        );

        postWebviewMessage({
          action: "clickthroughOverlayWebView",
          payload: {
            clickthrough: isHovered,
          },
        });
      } catch (err) {
        console.error("Error in clickthrough recovery check:", err);
      }
    }, 1000); // Check every second

    return () => clearInterval(checkInterval);
  }, [lockedWindow]);

  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const isTextInput =
        (event.target as HTMLElement).tagName === "INPUT" ||
        (event.target as HTMLElement).tagName === "TEXTAREA" ||
        (event.target as HTMLElement).isContentEditable;
      if (isTextInput) {
        postWebviewMessage({
          action: "inputFocus",
          payload: {
            value: true,
          },
        });
      }
    };

    const handleFocusOut = () => {
      postWebviewMessage({
        action: "inputFocus",
        payload: {
          value: false,
        },
      });
    };

    const handleWebviewMessage = (
      event: MessageEvent<WebviewKeyboardEvent>,
    ) => {
      const data = event.data;
      if (data.type !== "keyboard") return;

      const key =
        virtualKeyMap[data.wParam] || String.fromCharCode(data.wParam);
      const code = key.length === 1 ? `Key${key.toUpperCase()}` : key;
      const target = document.activeElement as HTMLElement;

      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const dispatchKeyboard = (type: "keydown" | "keyup") => {
        const event = new KeyboardEvent(type, {
          key,
          code,
          bubbles: true,
          cancelable: true,
        });
        document.dispatchEvent(event);
        if (isEditable) target.dispatchEvent(event);
      };

      const dispatchBackspace = () => {
        if (!isEditable) return;

        const input = target as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;

        if (start === 0 && start === end) return;

        const before = input.value.slice(0, start === end ? start - 1 : start);
        const after = input.value.slice(end);
        const newVal = before + after;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(input, newVal);

        const newCursor = start === end ? start - 1 : start;
        input.selectionStart = input.selectionEnd = Math.max(0, newCursor);

        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);
      };

      const dispatchInputChar = (char: string) => {
        if (!isEditable || !char) return;

        const input = target as HTMLInputElement | HTMLTextAreaElement;

        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;

        const oldVal = input.value;
        const newVal = oldVal.slice(0, start) + char + oldVal.slice(end);

        // Update value using native setter so React sees it
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(input, newVal);

        // Set cursor position
        input.selectionStart = input.selectionEnd = start + char.length;

        // Dispatch input event that React can pick up
        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);
      };

      const dispatchDelete = () => {
        if (!isEditable) return;

        const input = target as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;

        if (start === input.value.length && start === end) return; // Nothing to delete

        const before = input.value.slice(0, start);
        const after = input.value.slice(end === start ? start + 1 : end);
        const newVal = before + after;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeInputValueSetter?.call(input, newVal);

        input.selectionStart = input.selectionEnd = start;

        const event = new Event("input", { bubbles: true });
        input.dispatchEvent(event);
      };

      const dispatchArrowMovement = (
        direction: "left" | "right" | "up" | "down",
      ) => {
        if (!isEditable) return;

        const input = target as HTMLInputElement | HTMLTextAreaElement;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const length = input.value.length;

        let newPos = start;

        switch (direction) {
          case "left":
            newPos = Math.max(0, start - 1);
            break;
          case "right":
            newPos = Math.min(length, end + 1);
            break;
          case "up":
          case "down":
            // For multiline fields, calculate based on line height, skipped here for simplicity.
            break;
        }

        input.selectionStart = input.selectionEnd = newPos;
      };

      switch (data.msg) {
        case WM_KEYDOWN:
        case WM_SYSKEYDOWN:
          switch (data.wParam) {
            case 0x08: // Backspace
              dispatchBackspace();
              break;
            case 0x2e: // Delete
              dispatchDelete();
              break;
            case 0x25: // ArrowLeft
              dispatchArrowMovement("left");
              break;
            case 0x27: // ArrowRight
              dispatchArrowMovement("right");
              break;
            case 0x26: // ArrowUp
              dispatchArrowMovement("up");
              break;
            case 0x28: // ArrowDown
              dispatchArrowMovement("down");
              break;
            default:
              dispatchKeyboard("keydown");
              break;
          }
          break;

        case WM_KEYUP:
        case WM_SYSKEYUP:
          dispatchKeyboard("keyup");
          break;

        case WM_CHAR:
          if (data.char) {
            const charCode = data.wParam;
            if (charCode >= 0x20 && charCode <= 0x7e) {
              dispatchInputChar(data.char);
            }
          }
          break;
      }
    };

    document.addEventListener("focusin", handleFocusIn);

    document.addEventListener("focusout", handleFocusOut);

    window.chrome.webview.addEventListener("message", handleWebviewMessage);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      window.chrome.webview.removeEventListener(
        "message",
        handleWebviewMessage,
      );
    };
  }, []);

  if (lockedWindow) return <></>;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onMouseEnter={() => {
        postWebviewMessage({
          action: "clickthroughOverlayWebView",
          payload: {
            clickthrough: true,
          },
        });
      }}
      onMouseLeave={() => {
        postWebviewMessage({
          action: "clickthroughOverlayWebView",
          payload: {
            clickthrough: false,
          },
        });
      }}
    />
  );
}
