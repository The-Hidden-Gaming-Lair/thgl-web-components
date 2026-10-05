"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Top loading bar for page navigations. Without it, a click on a link whose
 * page isn't edge-cached gave no feedback at all until the server answered —
 * seconds during an origin slowdown, so the click looked dead.
 *
 * - Starts on a same-origin link click that leads to a different pathname
 *   (query/hash-only changes, like map filters, never show it).
 * - Only becomes visible after SHOW_DELAY_MS, so cached navigations that
 *   finish quickly never flash a bar.
 * - Creeps toward ~90% while waiting, completes and fades when the pathname
 *   changes. A safety timeout hides it if a click was intercepted by code
 *   that never navigated.
 *
 * Mounted once per root layout that renders <body> (games-web only; the
 * Overwolf Vite apps have no server round-trip on navigation).
 */
const SHOW_DELAY_MS = 200;
const GIVE_UP_MS = 30_000;

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const timers = useRef<number[]>([]);
  const active = useRef(false);
  const shown = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    function start() {
      if (active.current) return;
      active.current = true;
      clearTimers();
      setProgress(null);
      setDone(false);
      timers.current.push(
        window.setTimeout(() => {
          if (!active.current) return;
          shown.current = true;
          setProgress(15);
          // Creep: each step closes part of the remaining gap to 90%.
          const creep = () => {
            setProgress((p) => (p === null ? p : p + (90 - p) * 0.12));
            timers.current.push(window.setTimeout(creep, 400));
          };
          timers.current.push(window.setTimeout(creep, 400));
        }, SHOW_DELAY_MS),
        window.setTimeout(() => finish(), GIVE_UP_MS),
      );
    }

    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.hasAttribute("download")) return;
      if (a.target && a.target !== "_self") return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return;
      start();
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // finish is stable for this component's lifetime (refs + setters only)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    // Never shown (fast navigation): stay hidden.
    if (!shown.current) return;
    shown.current = false;
    setProgress(100);
    setDone(true);
    timers.current.push(
      window.setTimeout(() => {
        setProgress(null);
        setDone(false);
      }, 300),
    );
  }

  // The new page committed.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => clearTimers(), []);

  if (progress === null) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0"
      // Inline, not h-[3px]/z-[…]: arbitrary values from packages/ui aren't
      // generated in every app's Tailwind build (verified: height came out 0).
      style={{ height: 3, zIndex: 2147483647 }}
    >
      <div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          opacity: done ? 0 : 1,
          boxShadow: "0 0 8px hsl(var(--primary))",
          transition: "width 300ms ease-out, opacity 300ms ease-out",
        }}
      />
    </div>
  );
}
