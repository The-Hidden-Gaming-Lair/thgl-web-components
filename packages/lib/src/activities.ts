/**
 * Daily / weekly activities tracker (`/activities-tracker`, inbox #320): pure
 * logic over a game's `config/activities.json` (data-forge
 * `data-mining/src/lib/activities.ts` + `src/<game>/activities.ts`). Any game
 * that ships the file lights up the tool; nothing here is game-specific.
 *
 * Progress never needs a reset button: every tick stores WHEN it was made,
 * and a count only counts while it is newer than the last server reset of its
 * frequency (daily / weekly / monthly) in the viewer's chosen region.
 *
 * Side-effect free, so it runs (and is tested) on both server and client.
 */

export const ACTIVITIES_PATH = "/activities-tracker";

export type ActivityFrequency = "daily" | "weekly" | "monthly";

export type ActivitiesRegion = {
  id: string;
  name: string;
  tz?: string;
  utcOffsetMinutes?: number;
  dailyHour?: number;
  dailyMinute?: number;
};

export type ActivitiesReset = {
  dailyHour: number;
  dailyMinute?: number;
  weeklyDay: number;
  weeklyHour?: number;
  weeklyMinute?: number;
  regions: ActivitiesRegion[];
  source?: string;
};

export type ActivityDef = {
  id: string;
  name: string;
  category: string;
  max: number;
  frequency: ActivityFrequency;
  days?: number[];
  desc?: string;
  source?: string;
  legacy?: string[];
  /** Resets at a different time than the game default (same zone). */
  reset?: ActivityResetOverride;
};

export type ActivityResetOverride = {
  hour?: number;
  minute?: number;
  weeklyDay?: number;
};

export type ActivitiesConfig = {
  version: number;
  game: string;
  reset: ActivitiesReset;
  categories: { id: string; name: string }[];
  activities: ActivityDef[];
  terms?: Record<string, Record<string, string>>;
  legacyRetired?: string[];
};

/* ------------------------------------------------------------------ time */

type Wall = { y: number; m: number; d: number; h: number; mi: number };

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(tz: string): Intl.DateTimeFormat {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formatters.set(tz, f);
  }
  return f;
}

/** Offset (minutes, local − UTC) of the region at an instant. */
export function regionOffsetMinutes(
  region: Pick<ActivitiesRegion, "tz" | "utcOffsetMinutes">,
  at: number,
): number {
  if (region.tz === undefined) return region.utcOffsetMinutes ?? 0;
  const parts: Record<string, number> = {};
  for (const p of formatterFor(region.tz).formatToParts(new Date(at))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour === 24 ? 0 : parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60_000);
}

/** The region's wall clock at an instant (+ weekday, 0 = Sunday). */
function toWall(
  region: ActivitiesRegion,
  at: number,
): Wall & { weekday: number } {
  const local = new Date(at + regionOffsetMinutes(region, at) * 60_000);
  return {
    y: local.getUTCFullYear(),
    m: local.getUTCMonth(),
    d: local.getUTCDate(),
    h: local.getUTCHours(),
    mi: local.getUTCMinutes(),
    weekday: local.getUTCDay(),
  };
}

/** The instant a wall-clock time happens in the region (DST-safe). */
function fromWall(region: ActivitiesRegion, w: Wall): number {
  const naive = Date.UTC(w.y, w.m, w.d, w.h, w.mi);
  let at = naive - regionOffsetMinutes(region, naive) * 60_000;
  // Second pass settles instants next to a DST switch.
  at = naive - regionOffsetMinutes(region, at) * 60_000;
  return at;
}

function resetTime(
  reset: ActivitiesReset,
  region: ActivitiesRegion,
  frequency: ActivityFrequency,
): { h: number; mi: number } {
  const h = region.dailyHour ?? reset.dailyHour;
  const mi = region.dailyMinute ?? reset.dailyMinute ?? 0;
  if (frequency === "weekly" && reset.weeklyHour !== undefined) {
    return { h: reset.weeklyHour, mi: reset.weeklyMinute ?? 0 };
  }
  return { h, mi };
}

/** The last server reset of a frequency at or before `now`. */
export function lastResetAt(
  reset: ActivitiesReset,
  region: ActivitiesRegion,
  frequency: ActivityFrequency,
  now: number,
): number {
  const { h, mi } = resetTime(reset, region, frequency);
  const w = toWall(region, now);
  if (frequency === "monthly") {
    let at = fromWall(region, { y: w.y, m: w.m, d: 1, h, mi });
    if (at > now) at = fromWall(region, { y: w.y, m: w.m - 1, d: 1, h, mi });
    return at;
  }
  const back =
    frequency === "weekly" ? (w.weekday - reset.weeklyDay + 7) % 7 : 0;
  let at = fromWall(region, { y: w.y, m: w.m, d: w.d - back, h, mi });
  if (at > now) {
    const step = frequency === "weekly" ? 7 : 1;
    at = fromWall(region, { y: w.y, m: w.m, d: w.d - back - step, h, mi });
  }
  return at;
}

/** The next server reset of a frequency after `now`. */
export function nextResetAt(
  reset: ActivitiesReset,
  region: ActivitiesRegion,
  frequency: ActivityFrequency,
  now: number,
): number {
  const last = lastResetAt(reset, region, frequency, now);
  const { h, mi } = resetTime(reset, region, frequency);
  const w = toWall(region, last);
  if (frequency === "monthly") {
    return fromWall(region, { y: w.y, m: w.m + 1, d: 1, h, mi });
  }
  const step = frequency === "weekly" ? 7 : 1;
  return fromWall(region, { y: w.y, m: w.m, d: w.d + step, h, mi });
}

/**
 * The game reset rule as it applies to one activity (its own hour / weekly
 * day when it has an override). An hour override also beats a region hour.
 */
export function activityResetRule(
  reset: ActivitiesReset,
  region: ActivitiesRegion,
  override: ActivityResetOverride | undefined,
): { reset: ActivitiesReset; region: ActivitiesRegion } {
  if (!override) return { reset, region };
  const hasTime = override.hour !== undefined || override.minute !== undefined;
  return {
    reset: {
      ...reset,
      dailyHour: override.hour ?? region.dailyHour ?? reset.dailyHour,
      dailyMinute:
        override.minute ??
        (hasTime ? 0 : (region.dailyMinute ?? reset.dailyMinute)),
      weeklyDay: override.weeklyDay ?? reset.weeklyDay,
      weeklyHour: hasTime ? undefined : reset.weeklyHour,
      weeklyMinute: hasTime ? undefined : reset.weeklyMinute,
    },
    region: { ...region, dailyHour: undefined, dailyMinute: undefined },
  };
}

/** Last server reset that clears this activity (honours its override). */
export function activityLastReset(
  reset: ActivitiesReset,
  region: ActivitiesRegion,
  activity: { frequency: ActivityFrequency; reset?: ActivityResetOverride },
  now: number,
): number {
  const rule = activityResetRule(reset, region, activity.reset);
  return lastResetAt(rule.reset, rule.region, activity.frequency, now);
}

/** Weekday (0 = Sunday) of the current game day = the day of the last daily reset. */
export function gameWeekday(
  reset: ActivitiesReset,
  region: ActivitiesRegion,
  now: number,
): number {
  return toWall(region, lastResetAt(reset, region, "daily", now)).weekday;
}

/** Is the activity on today's schedule (no `days` = every day)? */
export function isAvailableToday(
  activity: Pick<ActivityDef, "days">,
  weekday: number,
): boolean {
  return !activity.days?.length || activity.days.includes(weekday);
}

/** "UTC+8", "UTC-4", "UTC+5:30" for the region at an instant. */
export function formatUtcOffset(minutes: number): string {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** Duration → compact parts (largest two units). */
export function splitDuration(ms: number): {
  d: number;
  h: number;
  m: number;
  s: number;
} {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86_400),
    h: Math.floor((total % 86_400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

// Viewer IANA zone prefix → server region ids that fit it.
const CONTINENT_REGION_IDS: { zone: RegExp; ids: RegExp }[] = [
  { zone: /^(Europe|Africa|Atlantic)[/]/, ids: /eu|global/i },
  { zone: /^America[/]/, ids: /america|^na|^sa|^us/i },
  {
    zone: /^(Asia|Australia|Pacific|Indian)[/]/,
    ids: /asia|sea|apac|hmt|hk|tw|jp|kr|oce/i,
  },
];

/**
 * The viewer's likely server: regions named for the viewer's continent
 * (from the IANA zone, e.g. Europe/Berlin → an EU / NAEU server), then the
 * one whose server clock is closest to the viewer's own offset.
 */
export function guessRegion(
  regions: ActivitiesRegion[],
  viewerOffsetMinutes: number,
  now: number,
  viewerTimeZone?: string,
): ActivitiesRegion {
  let candidates = regions;
  const rule = viewerTimeZone
    ? CONTINENT_REGION_IDS.find((c) => c.zone.test(viewerTimeZone))
    : undefined;
  if (rule) {
    const matching = regions.filter((r) => rule.ids.test(r.id));
    if (matching.length) candidates = matching;
  }
  let best = candidates[0];
  let bestDiff = Infinity;
  for (const r of candidates) {
    const diff = Math.abs(regionOffsetMinutes(r, now) - viewerOffsetMinutes);
    if (diff < bestDiff) {
      best = r;
      bestDiff = diff;
    }
  }
  return best;
}

export function findRegion(
  config: Pick<ActivitiesConfig, "reset">,
  regionId: string | undefined,
): ActivitiesRegion {
  const regions = config.reset.regions;
  return regions.find((r) => r.id === regionId) ?? regions[0];
}

/* -------------------------------------------------------------- progress */

export type CustomActivity = {
  /** Always starts with `custom:`. */
  id: string;
  name: string;
  /** Free text; shown as its own group. */
  category: string;
  max: number;
  frequency: ActivityFrequency;
};

export type ActivityTick = { n: number; at: number };

export type ActivityCharacter = { id: string; name: string };

export type ActivitiesState = {
  v: 2;
  region?: string;
  characters: ActivityCharacter[];
  active: string;
  /** character id → activity id → last count + when it was set. */
  progress: Record<string, Record<string, ActivityTick>>;
  /** Built-in activities the viewer hid (shared by all characters). */
  hidden: string[];
  custom: CustomActivity[];
  collapsed: string[];
  hideDone: boolean;
};

export const DEFAULT_CHARACTER: ActivityCharacter = { id: "main", name: "" };

export function emptyActivitiesState(): ActivitiesState {
  return {
    v: 2,
    characters: [{ ...DEFAULT_CHARACTER }],
    active: DEFAULT_CHARACTER.id,
    progress: {},
    hidden: [],
    custom: [],
    collapsed: [],
    hideDone: false,
  };
}

/** localStorage key of one game's tracker (per origin anyway; explicit). */
export function activitiesStorageKey(game: string): string {
  return `thgl-activities:${game}`;
}

/** The pre-2026-10 tracker's zustand key (one per tenant origin). */
export const LEGACY_ACTIVITIES_KEY = "activities";

const FREQUENCIES: ActivityFrequency[] = ["daily", "weekly", "monthly"];

function str(v: unknown, max = 120): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function posInt(v: unknown, cap = 10_000): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), cap) : null;
}

function cleanCustom(v: unknown): CustomActivity | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const name = str(o.name);
  const max = posInt(o.max);
  const frequency = FREQUENCIES.find((f) => f === o.frequency);
  if (!name || !max || !frequency) return null;
  const id = str(o.id, 200);
  return {
    id: id?.startsWith("custom:") ? id : customActivityId(name),
    name,
    category: str(o.category) ?? "",
    max,
    frequency,
  };
}

/** Stored / imported state → a clean object. Tolerates garbage. */
export function cleanActivitiesState(value: unknown): ActivitiesState {
  const base = emptyActivitiesState();
  if (!value || typeof value !== "object") return base;
  const o = value as Record<string, unknown>;
  const characters: ActivityCharacter[] = [];
  const seen = new Set<string>();
  if (Array.isArray(o.characters)) {
    for (const c of o.characters) {
      const id = str((c as { id?: unknown })?.id, 60);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      characters.push({
        id,
        name: str((c as { name?: unknown }).name, 40) ?? "",
      });
    }
  }
  if (!characters.length) characters.push({ ...DEFAULT_CHARACTER });
  const active = str(o.active, 60);
  const progress: ActivitiesState["progress"] = {};
  if (o.progress && typeof o.progress === "object") {
    for (const [cid, map] of Object.entries(o.progress)) {
      if (!characters.some((c) => c.id === cid)) continue;
      if (!map || typeof map !== "object") continue;
      const clean: Record<string, ActivityTick> = {};
      for (const [aid, tick] of Object.entries(map)) {
        const t = tick as { n?: unknown; at?: unknown } | null;
        const n = posInt(t?.n);
        const at = typeof t?.at === "number" ? t.at : NaN;
        if (n && Number.isFinite(at)) clean[aid] = { n, at };
      }
      progress[cid] = clean;
    }
  }
  const custom: CustomActivity[] = [];
  if (Array.isArray(o.custom)) {
    for (const c of o.custom) {
      const clean = cleanCustom(c);
      if (clean && !custom.some((x) => x.id === clean.id)) custom.push(clean);
    }
  }
  const strings = (v: unknown) =>
    Array.isArray(v)
      ? [...new Set(v.filter((x): x is string => typeof x === "string"))]
      : [];
  return {
    v: 2,
    region: str(o.region, 60) ?? undefined,
    characters,
    active: characters.some((c) => c.id === active)
      ? active!
      : characters[0].id,
    progress,
    hidden: strings(o.hidden),
    custom,
    collapsed: strings(o.collapsed),
    hideDone: o.hideDone === true,
  };
}

export function parseActivitiesState(
  raw: string | null | undefined,
): ActivitiesState | null {
  if (!raw) return null;
  try {
    return cleanActivitiesState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function customActivityId(name: string): string {
  return `custom:${name.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 80)}`;
}

/** Every activity the viewer tracks: built-ins (minus hidden) + custom. */
export function visibleActivities(
  config: Pick<ActivitiesConfig, "activities">,
  state: Pick<ActivitiesState, "hidden" | "custom">,
): (ActivityDef | (CustomActivity & { custom: true }))[] {
  const hidden = new Set(state.hidden);
  return [
    ...config.activities.filter((a) => !hidden.has(a.id)),
    ...state.custom.map((c) => ({ ...c, custom: true as const })),
  ];
}

/** Current count of one activity for the active character (0 after a reset). */
export function activityCount(
  state: ActivitiesState,
  activity: { id: string; frequency: ActivityFrequency; max: number },
  lastReset: Record<ActivityFrequency, number>,
): number {
  const tick = state.progress[state.active]?.[activity.id];
  if (!tick || tick.at < lastReset[activity.frequency]) return 0;
  return Math.min(tick.n, activity.max);
}

/** Set the count of one activity for the active character. */
export function setActivityCount(
  state: ActivitiesState,
  activityId: string,
  n: number,
  now: number,
): ActivitiesState {
  const mine = { ...(state.progress[state.active] ?? {}) };
  if (n <= 0) delete mine[activityId];
  else mine[activityId] = { n: Math.floor(n), at: now };
  return { ...state, progress: { ...state.progress, [state.active]: mine } };
}

/** Clear one frequency for the active character (the manual "reset now"). */
export function clearFrequency(
  state: ActivitiesState,
  frequencyOf: (activityId: string) => ActivityFrequency | undefined,
  frequency: ActivityFrequency,
): ActivitiesState {
  const mine = state.progress[state.active] ?? {};
  const next = Object.fromEntries(
    Object.entries(mine).filter(([id]) => frequencyOf(id) !== frequency),
  );
  return { ...state, progress: { ...state.progress, [state.active]: next } };
}

/** Drop ticks older than every reset that could still count them. */
export function pruneProgress(
  state: ActivitiesState,
  lastReset: Record<ActivityFrequency, number>,
): ActivitiesState {
  const oldest = Math.min(...Object.values(lastReset));
  let changed = false;
  const progress: ActivitiesState["progress"] = {};
  for (const [cid, map] of Object.entries(state.progress)) {
    const kept: Record<string, ActivityTick> = {};
    for (const [aid, tick] of Object.entries(map)) {
      if (tick.at >= oldest) kept[aid] = tick;
      else changed = true;
    }
    progress[cid] = kept;
  }
  return changed ? { ...state, progress } : state;
}

export function addCharacter(
  state: ActivitiesState,
  name: string,
  id: string,
): ActivitiesState {
  const clean = name.trim().slice(0, 40);
  return {
    ...state,
    characters: [...state.characters, { id, name: clean }],
    active: id,
  };
}

export function removeCharacter(
  state: ActivitiesState,
  id: string,
): ActivitiesState {
  if (state.characters.length < 2) return state;
  const characters = state.characters.filter((c) => c.id !== id);
  const progress = { ...state.progress };
  delete progress[id];
  return {
    ...state,
    characters,
    progress,
    active: state.active === id ? characters[0].id : state.active,
  };
}

/* ------------------------------------------------------------- migration */

type LegacyActivity = {
  title?: unknown;
  category?: unknown;
  max?: unknown;
  frequently?: unknown;
};

/**
 * The pre-2026-10 tracker (zustand persist under `activities`) → v2 state.
 * Its `customActivities` held the WHOLE list (defaults included, minus the
 * ones the viewer removed) and `progress` was keyed by English title with no
 * timestamp. Titles map to new ids through `legacy` / the English name;
 * defaults missing from the old list become hidden; unknown titles become
 * custom activities unless the data retired them. Counts carry over as of
 * `now` (they were the viewer's current state).
 */
export function migrateLegacyActivities(
  raw: string | null | undefined,
  config: Pick<ActivitiesConfig, "activities" | "terms" | "legacyRetired">,
  now: number,
): ActivitiesState | null {
  if (!raw) return null;
  let parsed: {
    state?: {
      customActivities?: LegacyActivity[];
      progress?: Record<string, unknown>;
    };
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const old = parsed?.state;
  if (!old || typeof old !== "object") return null;
  const en = config.terms?.en ?? {};
  const byTitle = new Map<string, string>();
  const norm = (s: string) => s.trim().toLowerCase();
  for (const a of config.activities) {
    for (const t of a.legacy ?? []) byTitle.set(norm(t), a.id);
    const name = en[a.name];
    if (name && !byTitle.has(norm(name))) byTitle.set(norm(name), a.id);
  }
  const retired = new Set((config.legacyRetired ?? []).map(norm));
  const state = emptyActivitiesState();
  const list = Array.isArray(old.customActivities) ? old.customActivities : [];
  const present = new Set<string>();
  for (const item of list) {
    const title = str(item?.title);
    if (!title) continue;
    const id = byTitle.get(norm(title));
    if (id) {
      present.add(id);
      continue;
    }
    if (retired.has(norm(title))) continue;
    const custom = cleanCustom({
      name: title,
      category: item.category,
      max: item.max,
      frequency: item.frequently,
    });
    if (custom && !state.custom.some((c) => c.id === custom.id)) {
      state.custom.push(custom);
    }
  }
  if (list.length) {
    // A built-in with old titles that is absent from the old list was removed
    // by the viewer. New entries (no legacy title) stay visible.
    state.hidden = config.activities
      .filter((a) => a.legacy?.length && !present.has(a.id))
      .map((a) => a.id);
  }
  const mine: Record<string, ActivityTick> = {};
  for (const [title, value] of Object.entries(old.progress ?? {})) {
    const n = posInt(value);
    if (!n) continue;
    const id =
      byTitle.get(norm(title)) ??
      state.custom.find((c) => norm(c.name) === norm(title))?.id;
    if (id) mine[id] = { n, at: now };
  }
  state.progress[state.active] = mine;
  return state;
}

/* --------------------------------------------------------- export/import */

export class ActivitiesImportError extends Error {
  constructor(
    public reason: "invalid" | "wrong-game",
    public game?: string,
  ) {
    super(reason);
  }
}

export function exportActivitiesJson(
  game: string,
  state: ActivitiesState,
): string {
  return JSON.stringify(
    { app: "thgl-activities", game, exported: new Date().toISOString(), state },
    null,
    1,
  );
}

export function parseActivitiesJson(
  text: string,
  game: string,
): ActivitiesState {
  let parsed: { app?: unknown; game?: unknown; state?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ActivitiesImportError("invalid");
  }
  if (parsed?.app !== "thgl-activities" || !parsed.state) {
    throw new ActivitiesImportError("invalid");
  }
  if (parsed.game !== game) {
    throw new ActivitiesImportError(
      "wrong-game",
      typeof parsed.game === "string" ? parsed.game : undefined,
    );
  }
  return cleanActivitiesState(parsed.state);
}
