// Palia clock model: the in-game day and its timed events, as shipped by
// data-forge in public/palia/config/events.json (extractTimedEvents in
// data-mining/src/palia/index.ts). Pure functions - the popover in
// palia-clock.tsx and the alert hook build on these; palia-clock-model.test.ts
// pins the arithmetic.

export const PALIA_DAY_MINUTES = 1440;

export type PaliaEventPhase = {
  /** Real seconds; null = open-ended (ends once `gatherPct` of the spawns are taken). */
  seconds: number | null;
  /** The player-visible part; earlier phases are the lead-in, later ones the tail. */
  main?: true;
};

export type PaliaEvent = {
  /** Dict key of the name; also the filter type when the spots are map markers. */
  id: string;
  kind: "daily" | "reset" | "shop" | "market";
  map: string;
  filter?: string;
  /** Dict key of the place label when it is not the map name. */
  placeKey?: string;
  /** Palia minute of day when the first phase starts (or a fixed window opens). */
  start: number;
  /** Palia minute of day when a fixed window closes (shop/market). */
  end?: number;
  phases?: PaliaEventPhase[];
  gatherPct?: number;
  /** Real-minute backstop after which an open-ended event is torn down. */
  maxMinutes?: number;
  active?: number;
  /** [lat, lng] candidate spots. */
  locations: [number, number][];
  /** Real-world UTC windows in which the event exists at all (market weeks). */
  windows?: [string, string][];
  minigames?: { id: string; start: number }[];
};

export type PaliaEventsConfig = {
  dayLengthSeconds: number;
  dayPhases: { id: string; start: number }[];
  events: PaliaEvent[];
};

/** Fractional Palia minute of day for a real timestamp (Palia midnight = top of the real hour). */
export function paliaMinuteAt(nowMs: number, dayLengthSeconds = 3600): number {
  const secondsIntoDay =
    (((nowMs / 1000) % dayLengthSeconds) + dayLengthSeconds) % dayLengthSeconds;
  return (secondsIntoDay / dayLengthSeconds) * PALIA_DAY_MINUTES;
}

/** Real seconds one Palia minute lasts (2.5 s for the one-hour day). */
export const realSecondsPerPaliaMinute = (dayLengthSeconds = 3600): number =>
  dayLengthSeconds / PALIA_DAY_MINUTES;

/** Palia minutes a real duration covers. */
export const paliaMinutesForRealSeconds = (
  seconds: number,
  dayLengthSeconds = 3600,
): number => (seconds / dayLengthSeconds) * PALIA_DAY_MINUTES;

export const wrapMinute = (minute: number): number =>
  ((minute % PALIA_DAY_MINUTES) + PALIA_DAY_MINUTES) % PALIA_DAY_MINUTES;

/** Palia minutes from `now` forward to `target` (0 when equal, never negative). */
export function minutesUntil(target: number, now: number): number {
  return wrapMinute(target - now);
}

/** True when `minute` lies in the wrap-around window [start, end). */
export function inWindow(minute: number, start: number, end: number): boolean {
  const m = wrapMinute(minute);
  const s = wrapMinute(start);
  const e = wrapMinute(end);
  if (s === e) return false;
  return s < e ? m >= s && m < e : m >= s || m < e;
}

/** "7:42 AM" / "12:00 PM" - the game's own 12-hour clock. */
export function formatPaliaTime(minute: number): string {
  const total = Math.floor(wrapMinute(minute));
  const h24 = Math.floor(total / 60);
  const mm = total % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

/** Which day phase (morning/day/evening/night) a Palia minute falls into. */
export function dayPhaseAt(
  minute: number,
  phases: PaliaEventsConfig["dayPhases"],
): PaliaEventsConfig["dayPhases"][number] | null {
  if (phases.length === 0) return null;
  const sorted = [...phases].sort((a, b) => a.start - b.start);
  const m = wrapMinute(minute);
  let current = sorted[sorted.length - 1];
  for (const phase of sorted) {
    if (m >= phase.start) current = phase;
  }
  return current;
}

export type EventSchedule = {
  /** First phase start (Palia minute). Equals mainStart for fixed windows. */
  leadStart: number;
  /** When the player-visible part begins. */
  mainStart: number;
  /** When it ends - null for open-ended phases (until gathered). */
  mainEnd: number | null;
  /** Real seconds the main phase lasts, when timed. */
  mainSeconds: number | null;
  /** Very end incl. tail phases (reward chest), when everything is timed. */
  end: number | null;
};

/** Resolve an event's phases into Palia-minute boundaries. */
export function resolveSchedule(
  event: PaliaEvent,
  dayLengthSeconds = 3600,
): EventSchedule {
  if (!event.phases || event.phases.length === 0) {
    const end = event.end ?? null;
    return {
      leadStart: event.start,
      mainStart: event.start,
      mainEnd: end,
      mainSeconds: null,
      end,
    };
  }
  let cursor = event.start;
  let mainStart = event.start;
  let mainEnd: number | null = null;
  let mainSeconds: number | null = null;
  let openEnded = false;
  for (const phase of event.phases) {
    const length =
      phase.seconds === null
        ? null
        : paliaMinutesForRealSeconds(phase.seconds, dayLengthSeconds);
    if (phase.main) {
      mainStart = wrapMinute(cursor);
      mainSeconds = phase.seconds;
      mainEnd = length === null ? null : wrapMinute(cursor + length);
    }
    if (length === null) {
      openEnded = true;
      break;
    }
    cursor += length;
  }
  return {
    leadStart: wrapMinute(event.start),
    mainStart,
    mainEnd,
    mainSeconds,
    end: openEnded ? null : wrapMinute(cursor),
  };
}

/** Palia minutes the popover shows an open-ended event as "started" (7.5 real minutes). */
export const OPEN_ENDED_DISPLAY_MINUTES = 180;

export type EventState =
  | "lead" // lead-in phases running (Crab Wars marshalling its troops)
  | "active" // main phase, timed
  | "started" // main phase, open-ended (until gathered)
  | "upcoming"
  | "away"; // market outside its real-world weeks

export type EventStatus = {
  state: EventState;
  /** Real seconds until the main phase starts (0 while running). */
  secondsToStart: number;
  /** Real seconds until the main phase ends; null when open-ended or not running. */
  secondsToEnd: number | null;
  schedule: EventSchedule;
};

export function marketWindow(
  event: PaliaEvent,
  nowMs: number,
): { current: [Date, Date] | null; next: [Date, Date] | null } {
  const windows = (event.windows ?? [])
    .map(([s, e]) => [new Date(s), new Date(e)] as [Date, Date])
    .sort((a, b) => a[0].getTime() - b[0].getTime());
  const current =
    windows.find((w) => w[0].getTime() <= nowMs && nowMs < w[1].getTime()) ??
    null;
  const next = windows.find((w) => w[0].getTime() > nowMs) ?? null;
  return { current, next };
}

export function eventStatus(
  event: PaliaEvent,
  nowMs: number,
  dayLengthSeconds = 3600,
): EventStatus {
  const schedule = resolveSchedule(event, dayLengthSeconds);
  const now = paliaMinuteAt(nowMs, dayLengthSeconds);
  const perMinute = realSecondsPerPaliaMinute(dayLengthSeconds);
  const toStart = minutesUntil(schedule.mainStart, now) * perMinute;

  if (event.windows && !marketWindow(event, nowMs).current) {
    return {
      state: "away",
      secondsToStart: toStart,
      secondsToEnd: null,
      schedule,
    };
  }

  if (schedule.mainEnd !== null) {
    if (inWindow(now, schedule.mainStart, schedule.mainEnd)) {
      return {
        state: "active",
        secondsToStart: 0,
        secondsToEnd: minutesUntil(schedule.mainEnd, now) * perMinute,
        schedule,
      };
    }
  } else if (
    inWindow(
      now,
      schedule.mainStart,
      schedule.mainStart + OPEN_ENDED_DISPLAY_MINUTES,
    )
  ) {
    return {
      state: "started",
      secondsToStart: 0,
      secondsToEnd: null,
      schedule,
    };
  }

  if (
    schedule.leadStart !== schedule.mainStart &&
    inWindow(now, schedule.leadStart, schedule.mainStart)
  ) {
    return {
      state: "lead",
      secondsToStart: toStart,
      secondsToEnd: null,
      schedule,
    };
  }
  return {
    state: "upcoming",
    secondsToStart: toStart,
    secondsToEnd: null,
    schedule,
  };
}

/** "4m 05s" / "12s" / "now". */
export function formatCountdown(seconds: number): string {
  if (seconds < 1) return "now";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

/** Centre of an event's spots ([lat, lng]) for "show on map"; null without spots. */
export function eventCenter(event: PaliaEvent): [number, number] | null {
  if (event.locations.length === 0) return null;
  const sum = event.locations.reduce(
    (acc, [lat, lng]) => [acc[0] + lat, acc[1] + lng],
    [0, 0],
  );
  return [sum[0] / event.locations.length, sum[1] / event.locations.length];
}
