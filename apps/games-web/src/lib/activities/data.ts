import {
  fetchActivitiesConfig,
  formatUtcOffset,
  nextResetAt,
  regionOffsetMinutes,
  type ActivitiesConfig,
  type ActivitiesRegion,
  type ActivityFrequency,
  type ActivityResetOverride,
  type AppConfig,
} from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";

/**
 * Activities tracker data for the current tenant: the game's
 * `config/activities.json` (null → the page 404s) plus everything localized
 * the client renders. Names come from the file's own `terms` (the game's
 * strings) or the global `activities.*` UI keys (generic categories/regions).
 */
export async function loadActivities(
  appConfig: AppConfig,
): Promise<ActivitiesConfig | null> {
  return fetchActivitiesConfig(appConfig.name);
}

/** UI dict + the file's own terms for the locale (en as fallback). */
export function activitiesDict(
  config: ActivitiesConfig,
  dict: Record<string, string>,
  locale: string,
): Record<string, string> {
  return {
    ...dict,
    ...(config.terms?.en ?? {}),
    ...(config.terms?.[locale] ?? {}),
  };
}

export type ActivityView = {
  id: string;
  name: string;
  desc?: string;
  category: string;
  max: number;
  frequency: ActivityFrequency;
  days?: number[];
  legacy?: string[];
  reset?: ActivityResetOverride;
};

export type ActivitiesView = {
  game: string;
  reset: ActivitiesConfig["reset"];
  regions: (ActivitiesRegion & { label: string })[];
  categories: { id: string; name: string }[];
  activities: ActivityView[];
  /** For the old-localStorage migration (English names + retired titles). */
  legacyRetired?: string[];
  enNames: Record<string, string>;
};

/** Resolve names for one locale (what the client component receives). */
export function activitiesView(
  config: ActivitiesConfig,
  dict: Record<string, string>,
): ActivitiesView {
  const en = config.terms?.en ?? {};
  return {
    game: config.game,
    reset: config.reset,
    regions: config.reset.regions.map((r) => ({
      ...r,
      label: resolveDict(dict, r.name),
    })),
    categories: config.categories.map((c) => ({
      id: c.id,
      name: resolveDict(dict, c.name),
    })),
    activities: config.activities.map((a) => ({
      id: a.id,
      name: resolveDict(dict, a.name),
      desc: a.desc ? resolveDict(dict, a.desc) : undefined,
      category: a.category,
      max: a.max,
      frequency: a.frequency,
      days: a.days,
      legacy: a.legacy,
      reset: a.reset,
    })),
    legacyRetired: config.legacyRetired,
    enNames: Object.fromEntries(
      config.activities.map((a) => [a.id, en[a.name] ?? a.name]),
    ),
  };
}

/** "04:00" in the given locale. */
export function formatClock(locale: string, h: number, m: number): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(Date.UTC(2026, 0, 1, h, m));
}

/** Localized weekday name (0 = Sunday). 2026-01-04 was a Sunday. */
export function weekdayName(locale: string, day: number): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  }).format(Date.UTC(2026, 0, 4 + day));
}

/** Server-rendered reset table rows (current UTC offsets). */
export function resetRows(
  config: ActivitiesConfig,
  dict: Record<string, string>,
  locale: string,
  now: number,
) {
  const r = config.reset;
  return r.regions.map((region) => {
    const offset = formatUtcOffset(regionOffsetMinutes(region, now));
    const dh = region.dailyHour ?? r.dailyHour;
    const dm = region.dailyMinute ?? r.dailyMinute ?? 0;
    const wh = r.weeklyHour ?? dh;
    const wm = r.weeklyHour !== undefined ? (r.weeklyMinute ?? 0) : dm;
    return {
      id: region.id,
      label: resolveDict(dict, region.name),
      offset,
      daily: formatClock(locale, dh, dm),
      weekly: `${weekdayName(locale, r.weeklyDay)} ${formatClock(locale, wh, wm)}`,
      nextDaily: nextResetAt(r, region, "daily", now),
    };
  });
}

/** The `activities.*` UI strings of a locale (sent to the client). */
export function activitiesLabels(dict: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(dict).filter(([k]) => k.startsWith("activities.")),
  );
}
