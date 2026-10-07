import { useSyncExternalStore } from "react";

/**
 * Tracks which ad slots NitroPay left empty. Every auction (first render and
 * each refresh) ends in a `nitroAds.rendered` event; a no-fill comes through
 * as bidder/type "blank" with `adInfo.adUnitCode` = the createAd id. A later
 * refresh that fills the slot fires again with the winning bidder.
 *
 * `blank` is a counter instead of a flag so every new no-fill picks the next
 * house ad (see house-ad.tsx); 0 = filled or not rendered yet.
 */
type RenderedDetail = {
  type?: string;
  adInfo?: { adUnitCode?: string };
};

const blankRounds = new Map<string, number>();
const listeners = new Set<() => void>();
let round = 0;

export function reportAdRender(id: string, blank: boolean): void {
  const next = blank ? ++round : 0;
  if ((blankRounds.get(id) ?? 0) === next) return;
  blankRounds.set(id, next);
  listeners.forEach((l) => l());
}

if (typeof document !== "undefined") {
  document.addEventListener("nitroAds.rendered", (event) => {
    const detail = (event as CustomEvent<RenderedDetail>).detail;
    const id = detail?.adInfo?.adUnitCode;
    if (!id) return;
    reportAdRender(id, detail.type === "blank");
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 0 while the slot shows an ad (or has not rendered); otherwise a round number. */
export function useAdBlankRound(id: string): number {
  return useSyncExternalStore(
    subscribe,
    () => blankRounds.get(id) ?? 0,
    () => 0,
  );
}
