"use client";

import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "../(header)";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useEffect, useRef, useState } from "react";
import { useSessionStorage } from "@uidotdev/usehooks";
import { useT } from "../(providers)";

// Obfuscated key generation to prevent easylist blocking
function getStorageKey() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  // Build key using array operations to avoid String.prototype.concat targeting
  const parts = ["_", "x", "9", "f", "2", "e", "_"];
  parts.push(y.toString(), m, d);
  return parts.join("");
}

const DISMISS_COUNTDOWN = 5;
const SHOW_DELAY_MS = 30_000; // 30 seconds before showing
const MIN_INTERACTIONS = 3; // require some user engagement first

export function AdBlocker() {
  const t = useT();
  const mountTime = useRef(Date.now());
  const [timeLeft, setTimeLeft] = useState(DISMISS_COUNTDOWN);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const interactionsRef = useRef(0);

  const sessionKey = getStorageKey();

  const [dismissed, setDismissed] = useSessionStorage<boolean | undefined>(
    sessionKey,
    undefined,
  );

  // Delay showing: wait for minimum time AND user engagement
  useEffect(() => {
    if (dismissed || ready) return;

    let lastInteractionTime = 0;
    const handleInteraction = () => {
      // Debounce: count at most one interaction per 300ms
      // (prevents click+pointerdown on same tap from counting twice)
      const now = Date.now();
      if (now - lastInteractionTime < 300) return;
      lastInteractionTime = now;
      interactionsRef.current++;
    };

    // Track user engagement (works on both desktop and mobile)
    document.addEventListener("click", handleInteraction);
    document.addEventListener("wheel", handleInteraction, { passive: true });
    document.addEventListener("touchend", handleInteraction);

    const checkReady = () => {
      const elapsed = Date.now() - mountTime.current;
      if (
        elapsed >= SHOW_DELAY_MS &&
        interactionsRef.current >= MIN_INTERACTIONS
      ) {
        setReady(true);
      }
    };

    const intervalId = setInterval(checkReady, 2000);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("wheel", handleInteraction);
      document.removeEventListener("touchend", handleInteraction);
      clearInterval(intervalId);
    };
  }, [dismissed, ready]);

  // Dismiss countdown (only starts when dialog is visible)
  useEffect(() => {
    if (!ready || timeLeft <= 0) return;

    const timeoutId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [ready, timeLeft]);

  if (dismissed || !ready) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-nosnippet>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("adblocker.title")}</AlertDialogTitle>
        </AlertDialogHeader>

        <p>{t("adblocker.intro")}</p>

        <ExternalAnchor
          href="https://www.th.gl/blog/ad-blockers-breaking-websites"
          className="flex gap-1 text-sm text-primary hover:underline items-center"
          onClick={(e) => {
            window.open(
              "https://www.th.gl/blog/ad-blockers-breaking-websites",
              "_blank",
            );
            e.preventDefault();
          }}
        >
          <span>Learn more about why ad blockers can break TH.GL features</span>
          <ExternalLink className="w-3 h-3" />
        </ExternalAnchor>

        <ul className="mb-4 list-disc list-inside space-y-2">
          <li>
            <span className="font-bold">{t("adblocker.supportTitle")}</span>{" "}
            {t("adblocker.supportText")}
            <ExternalAnchor
              href="https://www.th.gl/support-me"
              className="flex gap-1 text-primary hover:underline items-center"
              onClick={(e) => {
                window.open("https://www.th.gl/support-me", "_blank");
                e.preventDefault();
              }}
            >
              <span>{t("adblocker.supportLink")}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>

          <li>
            <span className="font-bold">{t("adblocker.keepAdsTitle")}</span>{" "}
            {t("adblocker.keepAdsText")}
          </li>

          <li>
            <span className="font-bold">{t("adblocker.helpTitle")}</span>{" "}
            {t("adblocker.helpText")}
            <ExternalAnchor
              href="#"
              className="flex gap-1 text-primary hover:underline"
              onClick={(e) => {
                window.open("https://www.th.gl/discord", "_blank");
                e.preventDefault();
              }}
            >
              <span>{t("adblocker.discordLink")}</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </li>
        </ul>

        <p className="text-secondary-foreground">{t("adblocker.thanks")}</p>

        <AlertDialogCancel
          disabled={timeLeft > 0}
          onClick={() => {
            if (timeLeft > 0) return;
            setDismissed(true);
            setOpen(false);
          }}
        >
          {t.rich("adblocker.close", {
            components: {
              countdown: timeLeft > 0 ? ` (${timeLeft})` : "",
            },
          })}
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
}
