"use client";

import { useEffect, useState } from "react";
import {
  getTipState,
  isApp,
  recordVisitDay,
  TH_GL_URL,
  updateTipState,
  type AppConfig,
} from "@repo/lib";
import { X } from "lucide-react";
import { useT } from "../(providers)";
import { trackEvent } from "../(header)/plausible-tracker";

const TIP_ID = "companion-app";
const SNOOZE_MS = 90 * 24 * 3600 * 1000;
const MAX_SHOWS = 3;
// Returning visitors (2nd+ distinct day) get the tip early; first-day
// visitors only after real engagement. Interactions gate out idle tabs.
const RETURNING_DELAY_MS = 30_000;
const FIRST_DAY_DELAY_MS = 180_000;
const RETURNING_MIN_INTERACTIONS = 3;
const FIRST_DAY_MIN_INTERACTIONS = 10;

/** "Did you know?" nudge pointing regular web-map users at the in-game
 *  companion app. Renders nothing inside the overlay apps, on
 *  non-companion tenants, after a click (converted or not interested),
 *  or while dismissed/snoozed. Force-show for testing: `?tip=companion-app`. */
export function DidYouKnowCompanionApp({
  appConfig,
}: {
  appConfig: AppConfig;
}) {
  const [visible, setVisible] = useState(false);
  const t = useT();
  const appUrl = appConfig.appUrl;

  useEffect(() => {
    if (!appUrl?.includes("companion-app") || isApp) return;
    const state = getTipState(TIP_ID);
    const force = new URLSearchParams(location.search).get("tip") === TIP_ID;
    if (!force) {
      if (state.clickedAt || state.shownCount >= MAX_SHOWS) return;
      if (state.dismissedAt && Date.now() - state.dismissedAt < SNOOZE_MS)
        return;
    }

    const visitDays = recordVisitDay();
    const returning = visitDays >= 2;
    const delayMs = force
      ? 0
      : returning
        ? RETURNING_DELAY_MS
        : FIRST_DAY_DELAY_MS;
    const minInteractions = force
      ? 0
      : returning
        ? RETURNING_MIN_INTERACTIONS
        : FIRST_DAY_MIN_INTERACTIONS;

    let interactions = 0;
    let visibleMs = 0;
    let shown = false;

    const maybeShow = () => {
      if (shown || visibleMs < delayMs || interactions < minInteractions)
        return;
      shown = true;
      cleanup();
      setVisible(true);
      if (force) return; // testing — don't consume the show budget
      updateTipState(TIP_ID, {
        shownCount: getTipState(TIP_ID).shownCount + 1,
      });
      trackEvent("Did You Know: Shown", { props: { tip: TIP_ID } });
    };
    const onInteract = () => {
      interactions++;
      maybeShow();
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) =>
      window.addEventListener(e, onInteract, { passive: true }),
    );
    // Accumulate only tab-visible time so a background tab never triggers.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        visibleMs += 1000;
        maybeShow();
      }
    }, 1000);
    const cleanup = () => {
      events.forEach((e) => window.removeEventListener(e, onInteract));
      clearInterval(interval);
    };
    if (force) maybeShow();
    return cleanup;
  }, [appUrl]);

  if (!visible) return null;

  return (
    <aside className="fixed bottom-4 right-4 z-9998 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur">
      <button
        aria-label="Dismiss"
        onClick={() => {
          updateTipState(TIP_ID, { dismissedAt: Date.now() });
          trackEvent("Did You Know: Dismissed", { props: { tip: TIP_ID } });
          setVisible(false);
        }}
        className="absolute right-2 top-2 z-10 rounded-md bg-black/60 p-1 opacity-80 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
      <a
        href={appUrl!}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          updateTipState(TIP_ID, { clickedAt: Date.now() });
          trackEvent("Did You Know: Clicked", { props: { tip: TIP_ID } });
          setVisible(false);
        }}
        className="block"
      >
        <img
          src={`${TH_GL_URL}/games/thgl-web/images/overlay-dune-awakening.webp`}
          alt=""
          loading="lazy"
          className="h-32 w-full object-cover object-top"
        />
        <div className="space-y-1.5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("tips.didYouKnow")}
          </p>
          <p className="text-sm">
            {t("tips.companionApp", { vars: { game: appConfig.title } })}
          </p>
          <p className="text-sm font-medium text-primary">
            {t("tips.learnMore")} →
          </p>
        </div>
      </a>
    </aside>
  );
}
