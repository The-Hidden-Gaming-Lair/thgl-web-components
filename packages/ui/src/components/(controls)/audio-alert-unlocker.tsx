"use client";

import { useEffect } from "react";
import { initAudioAlertUnlock } from "./audio-alert";

/**
 * Headless. Mounted once per app (next to `NewVersionWatcher` in the root
 * layouts) so the alert AudioContext gets unlocked by the first user gesture
 * instead of staying silently `suspended` on iOS/iPadOS.
 *
 * An explicit component rather than module-scope `document` listeners: keeps
 * `audio-alert.ts` importable from a server component without side effects,
 * and makes the behaviour greppable from the layouts.
 */
export function AudioAlertUnlocker() {
  useEffect(() => initAudioAlertUnlock(), []);
  return null;
}
