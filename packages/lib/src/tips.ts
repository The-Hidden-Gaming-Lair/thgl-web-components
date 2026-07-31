// Client-side state for "Did you know?" tips shown on the web map sites
// (see packages/ui (tips)). localStorage can be unavailable (SSR, privacy
// modes) — every helper degrades gracefully instead of throwing.

export type TipState = {
  shownCount: number;
  dismissedAt?: number;
  clickedAt?: number;
};

const VISIT_DAYS_KEY = "thgl-visit-days";
const MAX_VISIT_DAYS = 30;

/** Records today as a visit day and returns how many distinct days (capped
 *  at MAX_VISIT_DAYS) this browser has visited the site. Used to target
 *  returning visitors with tips instead of first-time bounces. */
export function recordVisitDay(): number {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const days: string[] = JSON.parse(
      localStorage.getItem(VISIT_DAYS_KEY) ?? "[]",
    );
    if (!days.includes(today)) {
      days.push(today);
      while (days.length > MAX_VISIT_DAYS) days.shift();
      localStorage.setItem(VISIT_DAYS_KEY, JSON.stringify(days));
    }
    return days.length;
  } catch {
    return 1;
  }
}

export function getTipState(id: string): TipState {
  try {
    return {
      shownCount: 0,
      ...JSON.parse(localStorage.getItem(`thgl-tip-${id}`) ?? "{}"),
    };
  } catch {
    return { shownCount: 0 };
  }
}

export function updateTipState(id: string, patch: Partial<TipState>): void {
  try {
    localStorage.setItem(
      `thgl-tip-${id}`,
      JSON.stringify({ ...getTipState(id), ...patch }),
    );
  } catch {
    // localStorage unavailable — the tip state just won't persist.
  }
}
