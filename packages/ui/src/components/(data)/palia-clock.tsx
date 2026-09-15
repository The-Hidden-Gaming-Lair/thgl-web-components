"use client";

import { DATA_FORGE_CDN_URL, cn, useSettingsStore } from "@repo/lib";
import { Bell, BellOff, HelpCircle, Info, MapPin } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { playAlertSound } from "../(controls)/audio-alert";
import { useMap } from "../(interactive-map)/store";
import { useI18n, useLocale, useT, useUserStore } from "../(providers)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Switch } from "../ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  dayPhaseAt,
  eventCenter,
  eventStatus,
  formatCountdown,
  formatPaliaTime,
  marketWindow,
  paliaMinuteAt,
  paliaMinutesForRealSeconds,
  realSecondsPerPaliaMinute,
  wrapMinute,
  type EventStatus,
  type PaliaEvent,
  type PaliaEventsConfig,
} from "./palia-clock-model";

// Palia clock popover: the in-game day as a horizontal strip with the day
// phases and every timed event, plus a list with real-time countdowns, a
// "show on map" jump per event and an optional start alert. The schedule is
// data-forge output (config/events.json, derived from the game's activation
// managers), so the times follow the game files rather than a hand-kept list.

const EVENTS_URL = `${DATA_FORGE_CDN_URL}/palia/config/events.json`;
const FAQ_URL = "https://www.th.gl/faq/palia-event-clock";

// Presentation only - accents per event (the data carries no colors).
const EVENT_COLORS: Record<string, string> = {
  crab_wars: "#ffab00",
  flow_tree_grove: "#b46cff",
  precious_ore_nodes: "#ffd54a",
  flower_bloom: "#ff8c42",
  piksii_blossom_bounce: "#52e3e1",
  zeki_underground: "#f77976",
  maji_market: "#fdf148",
};
const DEFAULT_COLOR = "#7dd3fc";

const PHASE_STYLE: Record<string, string> = {
  tod_morning: "bg-indigo-300/25",
  tod_day: "bg-amber-200/25",
  tod_evening: "bg-orange-400/25",
  tod_night: "bg-slate-500/25",
};

let eventsPromise: Promise<PaliaEventsConfig | null> | null = null;
function loadPaliaEvents(): Promise<PaliaEventsConfig | null> {
  if (!eventsPromise) {
    eventsPromise = fetch(EVENTS_URL)
      .then((res) =>
        res.ok ? (res.json() as Promise<PaliaEventsConfig>) : null,
      )
      .catch(() => null);
  }
  return eventsPromise;
}

function usePaliaEvents(): PaliaEventsConfig | null {
  const [config, setConfig] = useState<PaliaEventsConfig | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadPaliaEvents().then((data) => {
      if (!cancelled) setConfig(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return config;
}

// Ticks once per second while mounted (the strip needle and countdowns).
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

// Ids of the events running right now, re-evaluated every Palia minute so the
// closed readout can light up while something is on.
function useActiveEventIds(config: PaliaEventsConfig | null): string[] {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    if (!config) return;
    const check = () => {
      const now = Date.now();
      const next = config.events
        .filter((event) => {
          const { state } = eventStatus(event, now, config.dayLengthSeconds);
          return state === "active" || state === "started";
        })
        .map((event) => event.id);
      setIds((prev) =>
        prev.length === next.length && prev.every((id, i) => id === next[i])
          ? prev
          : next,
      );
    };
    check();
    const id = setInterval(
      check,
      realSecondsPerPaliaMinute(config.dayLengthSeconds) * 1000,
    );
    return () => clearInterval(id);
  }, [config]);
  return ids;
}

// One alert per event and Palia day, no matter how many clocks are mounted
// (the sidebar row and the locked-window overlay never show at once, but a
// second map tab would).
const firedAlerts = new Map<string, number>();
/** Lead-time choices (real minutes before the start) offered in the popover. */
const LEAD_MINUTE_OPTIONS = [1, 2, 5, 10];

/** Reads an alert aloud when the browser has speech synthesis (opt-in). */
function speak(message: string, locale: string, volume: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = locale;
    utterance.volume = Math.max(0, Math.min(1, volume));
    window.speechSynthesis.speak(utterance);
  } catch {
    // No voices available - the sound alert still played.
  }
}

/**
 * Plays the alert sound when a subscribed event is about to start (the lead
 * time is a clock setting) and when it starts. Same audio-alert settings as
 * the tracked-item alerts (sound, volume, mute, and the "notifications"
 * switch for the on-screen notice); optionally read aloud. Mounted with the
 * clock, independent of the popover.
 */
function usePaliaEventAlerts(config: PaliaEventsConfig | null) {
  const alerts = useSettingsStore((s) => s.paliaEventAlerts);
  const leadMinutes = useSettingsStore((s) => s.paliaEventAlertLeadMinutes);
  const spoken = useSettingsStore((s) => s.paliaEventAlertsSpoken);
  const sound = useSettingsStore((s) => s.audioAlertSound);
  const volume = useSettingsStore((s) => s.audioAlertVolume);
  const muted = useSettingsStore((s) => s.audioAlertsMuted);
  const notifications = useSettingsStore((s) => s.audioAlertNotifications);
  const t = useT();
  const locale = useLocale();
  const subscribed = useMemo(
    () => Object.keys(alerts ?? {}).filter((id) => alerts[id]),
    [alerts],
  );

  useEffect(() => {
    if (!config || subscribed.length === 0) return;
    const check = () => {
      const now = Date.now();
      const day = Math.floor(now / (config.dayLengthSeconds * 1000));
      for (const event of config.events) {
        if (!subscribed.includes(event.id)) continue;
        const status = eventStatus(event, now, config.dayLengthSeconds);
        if (status.state === "away") continue;
        const name = t(event.id);
        const fire = (key: string, message: string) => {
          if (firedAlerts.get(key) === day) return;
          firedAlerts.set(key, day);
          if (!muted) {
            playAlertSound(sound, volume);
            if (spoken) speak(message, locale, volume);
          }
          if (notifications) toast(message, { id: key });
        };
        const leadSeconds = (leadMinutes ?? 1) * 60;
        if (
          leadSeconds > 0 &&
          (status.state === "upcoming" || status.state === "lead") &&
          status.secondsToStart <= leadSeconds
        ) {
          fire(
            `${event.id}:lead`,
            t("paliaClock.alertSoonMinutes", {
              fallback: "{{name}} starts in {{minutes}} min",
              vars: { name, minutes: String(leadMinutes ?? 1) },
            }),
          );
        } else if (
          (status.state === "active" || status.state === "started") &&
          status.secondsToStart === 0
        ) {
          fire(
            `${event.id}:start`,
            t("paliaClock.alertStarted", {
              fallback: "{{name}} has started",
              vars: { name },
            }),
          );
        }
      }
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [
    config,
    subscribed,
    leadMinutes,
    spoken,
    sound,
    volume,
    muted,
    notifications,
    t,
    locale,
  ]);
}

/** Formats a real-world date in the viewer's locale ("Sep 15"). */
function formatDay(locale: string, date: Date): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(date);
  }
}

type EventRow = {
  event: PaliaEvent;
  status: EventStatus;
  color: string;
};

const STATE_ORDER: Record<EventStatus["state"], number> = {
  active: 0,
  started: 1,
  lead: 2,
  upcoming: 3,
  away: 4,
};

/**
 * The 24-hour strip: day-phase bands, one lane per event (its main window,
 * lead-in dimmed) and the "now" needle.
 */
function DayStrip({
  config,
  rows,
  nowMinute,
}: {
  config: PaliaEventsConfig;
  rows: EventRow[];
  nowMinute: number;
}) {
  const t = useT();
  const phases = [...config.dayPhases].sort((a, b) => a.start - b.start);
  // Segment ends may be exactly 1440 (a window running to midnight), so no
  // wrapping here - the segments helper already hands out 0..1440 values.
  const pct = (minute: number) => (Math.min(minute, 1440) / 1440) * 100;
  // A [start, end) window as one or two absolutely positioned segments.
  const segments = (start: number, end: number) => {
    const s = wrapMinute(start);
    const e = wrapMinute(end);
    if (e > s) return [[s, e]] as [number, number][];
    return [
      [s, 1440],
      [0, e],
    ] as [number, number][];
  };
  return (
    <div className="space-y-1">
      <div className="relative h-3 overflow-hidden rounded-sm bg-muted">
        {phases.map((phase, i) => {
          const next = phases[(i + 1) % phases.length];
          return segments(phase.start, next.start).map(([s, e]) => (
            <div
              key={`${phase.id}-${s}`}
              className={cn(
                "absolute inset-y-0",
                PHASE_STYLE[phase.id] ?? "bg-slate-400/20",
              )}
              style={{ left: `${pct(s)}%`, width: `${pct(e) - pct(s)}%` }}
              title={t(phase.id, { fallback: phase.id })}
            />
          ));
        })}
      </div>
      <div className="space-y-px">
        {rows.map(({ event, status, color }) => {
          const { schedule } = status;
          const openEnd =
            schedule.mainEnd ??
            wrapMinute(
              schedule.mainStart +
                paliaMinutesForRealSeconds(
                  Math.min((event.maxMinutes ?? 7.5) * 60, 450),
                  config.dayLengthSeconds,
                ),
            );
          const lead =
            schedule.leadStart !== schedule.mainStart
              ? segments(schedule.leadStart, schedule.mainStart)
              : [];
          const main = segments(schedule.mainStart, openEnd);
          return (
            <div
              key={event.id}
              className="relative h-1.5"
              title={t(event.id, { fallback: event.id })}
            >
              {lead.map(([s, e]) => (
                <div
                  key={`lead-${s}`}
                  className="absolute inset-y-0 rounded-sm opacity-35"
                  style={{
                    left: `${pct(s)}%`,
                    width: `${pct(e) - pct(s)}%`,
                    backgroundColor: color,
                  }}
                />
              ))}
              {main.map(([s, e]) => (
                <div
                  key={`main-${s}`}
                  className={cn(
                    "absolute inset-y-0 rounded-sm",
                    status.state === "away" && "opacity-25",
                    schedule.mainEnd === null &&
                      "bg-linear-to-r from-[var(--c)] to-transparent",
                  )}
                  style={{
                    left: `${pct(s)}%`,
                    width: `${Math.max(pct(e) - pct(s), 0.6)}%`,
                    backgroundColor:
                      schedule.mainEnd === null ? undefined : color,
                    ["--c" as string]: color,
                  }}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div className="relative h-4 text-[10px] leading-4 text-muted-foreground">
        {[0, 6, 12, 18].map((h) => (
          <span
            key={h}
            className="absolute -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {formatPaliaTime(h * 60).replace(":00", "")}
          </span>
        ))}
        <span
          className="absolute -top-1 h-px w-px"
          style={{ left: `${pct(nowMinute)}%` }}
        />
      </div>
      {/* Needle over the whole strip (bands + lanes) */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 rounded bg-foreground shadow-[0_0_4px_rgba(0,0,0,0.8)]"
        style={{ left: `${pct(nowMinute)}%` }}
      />
    </div>
  );
}

function EventRowView({
  row,
  config,
  locale,
  now,
  onShowOnMap,
}: {
  row: EventRow;
  config: PaliaEventsConfig;
  locale: string;
  now: number;
  onShowOnMap: (event: PaliaEvent) => void;
}) {
  const t = useT();
  const { dict } = useI18n();
  const alerts = useSettingsStore((s) => s.paliaEventAlerts);
  const toggleAlert = useSettingsStore((s) => s.togglePaliaEventAlert);
  const { event, status, color } = row;
  // The marker description (HTML from data-forge) doubles as the explanation.
  const description = dict[`${event.id}_desc`];
  const { schedule } = status;
  const alertOn = alerts?.[event.id] ?? false;
  const place = t(event.placeKey ?? event.map, {
    fallback: event.placeKey ?? event.map,
  });
  const window =
    schedule.mainEnd === null
      ? formatPaliaTime(schedule.mainStart)
      : `${formatPaliaTime(schedule.mainStart)} – ${formatPaliaTime(schedule.mainEnd)}`;
  const spots =
    event.locations.length > 1
      ? t("paliaClock.spots", {
          fallback: "{{active}} of {{total}} spots",
          vars: {
            active: String(event.active ?? 1),
            total: String(event.locations.length),
          },
        })
      : null;
  const market = event.windows ? marketWindow(event, now) : null;

  let statusNode: ReactNode;
  if (status.state === "active") {
    statusNode = (
      <span className="font-medium text-amber-300">
        {t("paliaClock.active", { fallback: "Active" })}
        {status.secondsToEnd !== null && (
          <span className="ml-1 font-normal text-muted-foreground">
            {t("paliaClock.left", {
              fallback: "{{time}} left",
              vars: { time: formatCountdown(status.secondsToEnd) },
            })}
          </span>
        )}
      </span>
    );
  } else if (status.state === "started") {
    statusNode = (
      <span className="font-medium text-amber-300">
        {t("paliaClock.started", { fallback: "Started" })}
        <span className="ml-1 font-normal text-muted-foreground">
          {t("paliaClock.untilGathered", { fallback: "until gathered" })}
        </span>
      </span>
    );
  } else if (status.state === "away") {
    statusNode = (
      <span className="text-muted-foreground">
        {market?.next
          ? t("paliaClock.nextMarket", {
              fallback: "Next {{from}} – {{to}}",
              vars: {
                from: formatDay(locale, market.next[0]),
                to: formatDay(locale, market.next[1]),
              },
            })
          : t("paliaClock.notScheduled", { fallback: "Not scheduled" })}
      </span>
    );
  } else {
    statusNode = (
      <span className={cn(status.state === "lead" && "text-amber-200/80")}>
        {t("paliaClock.in", {
          fallback: "in {{time}}",
          vars: { time: formatCountdown(status.secondsToStart) },
        })}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-1.5 py-1 text-xs",
        (status.state === "active" || status.state === "started") &&
          "bg-amber-400/10",
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 grow">
        {/* Always three lines: title (+ info), place, time - so the info icon
            never wraps onto a line of its own. */}
        <div className="flex items-center gap-1 font-medium text-gray-100">
          <span className="truncate">
            {t(event.id, { fallback: event.id })}
          </span>
          {description && (
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={t("paliaClock.info", {
                    fallback: "What is this?",
                  })}
                >
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[300px] [&_p]:mb-1 [&_p:last-child]:mb-0"
              >
                <p className="font-semibold">
                  {t(event.id, { fallback: event.id })}
                </p>
                <div
                  className="text-xs text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {place}
          {spots && ` · ${spots}`}
        </div>
        <div className="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
          <span className="tabular-nums">{window}</span>
          {schedule.mainSeconds !== null && (
            <span>
              {t("paliaClock.realMinutes", {
                fallback: "{{minutes}} real min",
                vars: { minutes: String(schedule.mainSeconds / 60) },
              })}
            </span>
          )}
          {market?.current && (
            <span>
              {t("paliaClock.until", {
                fallback: "until {{date}}",
                vars: { date: formatDay(locale, market.current[1]) },
              })}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right text-[11px] tabular-nums">
        {statusNode}
      </div>
      <div className="flex shrink-0 items-center">
        {(event.locations.length > 0 || event.map) && (
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={t("paliaClock.showOnMap", { fallback: "Show on map" })}
            onClick={() => onShowOnMap(event)}
          >
            <MapPin className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          className={cn(
            "rounded p-1 hover:bg-muted",
            alertOn
              ? "text-amber-300"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={alertOn}
          title={
            alertOn
              ? t("paliaClock.alertOff", { fallback: "Turn start alert off" })
              : t("paliaClock.alertOn", {
                  fallback: "Alert me when it starts",
                })
          }
          onClick={() => toggleAlert(event.id)}
        >
          {alertOn ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function PaliaClockContent({
  config,
  open,
}: {
  config: PaliaEventsConfig;
  open: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const now = useNow(open);
  const map = useMap();
  const mapName = useUserStore((s) => s.mapName);
  const setMapName = useUserStore((s) => s.setMapName);
  const filters = useUserStore((s) => s.filters);
  const toggleFilter = useUserStore((s) => s.toggleFilter);

  const nowMinute = paliaMinuteAt(now, config.dayLengthSeconds);
  const phase = dayPhaseAt(nowMinute, config.dayPhases);
  const nextPhase = useMemo(() => {
    const sorted = [...config.dayPhases].sort((a, b) => a.start - b.start);
    return sorted.find((p) => p.start > nowMinute) ?? sorted[0] ?? null;
  }, [config.dayPhases, nowMinute]);

  const rows = useMemo<EventRow[]>(
    () =>
      config.events
        .map((event) => ({
          event,
          status: eventStatus(event, now, config.dayLengthSeconds),
          color: EVENT_COLORS[event.id] ?? DEFAULT_COLOR,
        }))
        .sort(
          (a, b) =>
            STATE_ORDER[a.status.state] - STATE_ORDER[b.status.state] ||
            a.status.secondsToStart - b.status.secondsToStart,
        ),
    [config, now],
  );

  const showOnMap = useCallback(
    (event: PaliaEvent) => {
      const filter = event.filter ?? event.id;
      if (event.locations.length > 0 && !filters.includes(filter)) {
        toggleFilter(filter);
      }
      const center = eventCenter(event);
      if (mapName !== event.map) {
        setMapName(event.map, center ?? undefined);
      } else if (center && map) {
        map.setView(center, map.getZoom());
      }
    },
    [filters, toggleFilter, mapName, setMapName, map],
  );

  const secondsToNextPhase = nextPhase
    ? ((nextPhase.start - nowMinute + 1440) % 1440) *
      realSecondsPerPaliaMinute(config.dayLengthSeconds)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tabular-nums leading-none text-gray-100">
            {formatPaliaTime(nowMinute)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {phase && (
              <span className="text-gray-300">
                {t(phase.id, { fallback: phase.id })}
              </span>
            )}
            {nextPhase && secondsToNextPhase !== null && (
              <span>
                {" · "}
                {t("paliaClock.nextPhase", {
                  fallback: "{{phase}} in {{time}}",
                  vars: {
                    phase: t(nextPhase.id, { fallback: nextPhase.id }),
                    time: formatCountdown(secondsToNextPhase),
                  },
                })}
              </span>
            )}
          </div>
        </div>
        <div className="text-right text-[11px] leading-tight text-muted-foreground">
          <div>
            {t("paliaClock.ratio", {
              fallback: "1 in-game day = 1 real hour",
            })}
          </div>
          <div className="tabular-nums">
            {new Date(now).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      <div className="relative">
        <DayStrip config={config} rows={rows} nowMinute={nowMinute} />
      </div>

      <div className="space-y-0.5">
        {rows.map((row) => (
          <EventRowView
            key={row.event.id}
            row={row}
            config={config}
            locale={locale}
            now={now}
            onShowOnMap={showOnMap}
          />
        ))}
      </div>

      <AlertOptions />
    </div>
  );
}

/** Lead time and read-aloud switch for the bell alerts (shared by all events). */
function AlertOptions() {
  const t = useT();
  const leadMinutes = useSettingsStore((s) => s.paliaEventAlertLeadMinutes);
  const setLeadMinutes = useSettingsStore(
    (s) => s.setPaliaEventAlertLeadMinutes,
  );
  const spoken = useSettingsStore((s) => s.paliaEventAlertsSpoken);
  const toggleSpoken = useSettingsStore((s) => s.togglePaliaEventAlertsSpoken);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const current = leadMinutes ?? 1;
  const options = LEAD_MINUTE_OPTIONS.includes(current)
    ? LEAD_MINUTE_OPTIONS
    : [...LEAD_MINUTE_OPTIONS, current].sort((a, b) => a - b);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border/50 pt-2 text-[11px] text-muted-foreground">
      <label className="flex items-center gap-1.5">
        <Bell className="h-3 w-3" />
        {t.rich("paliaClock.leadBefore", {
          fallback: "Alert {{minutes}} min before",
          components: {
            minutes: (
              <select
                className="rounded border border-border/60 bg-muted/60 px-1 py-0.5 text-[11px] text-foreground"
                value={current}
                onChange={(e) => setLeadMinutes(Number(e.target.value))}
              >
                {options.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ),
          },
        })}
      </label>
      {canSpeak && (
        <label className="flex items-center gap-1.5">
          {t("paliaClock.speak", { fallback: "Read alerts aloud" })}
          <Switch
            checked={spoken ?? false}
            onCheckedChange={() => toggleSpoken()}
            className="scale-75"
          />
        </label>
      )}
      <a
        href={FAQ_URL}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-1 hover:text-foreground hover:underline"
      >
        <HelpCircle className="h-3 w-3" />
        {t("paliaClock.about", { fallback: "About these events" })}
      </a>
    </div>
  );
}

/**
 * Wraps a clock readout so hovering or clicking it opens the event popover.
 * Hover opens it while the pointer stays; a click pins it until the next
 * click outside. Alerts for subscribed events run whenever this is mounted.
 */
export function PaliaClock({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  /** Plain readout, no popover (e.g. the locked overlay window). */
  disabled?: boolean;
}) {
  const config = usePaliaEvents();
  usePaliaEventAlerts(config);
  const activeIds = useActiveEventIds(config);
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    if (pinned) return;
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };
  useEffect(() => cancelClose, []);

  // While an event runs, the readout itself lights up (amber + pulsing dot)
  // so it is visible without opening the popover - also in the locked window.
  const activeTitle = activeIds.map((id) => t(id, { fallback: id })).join(", ");
  const activeDot = activeIds.length > 0 && (
    <span
      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400"
      aria-hidden
    />
  );

  if (disabled || !config) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap",
          activeIds.length > 0 && "text-amber-300",
          className,
        )}
        title={activeTitle || undefined}
      >
        {activeDot}
        {children}
      </span>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPinned(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-w-[6rem] items-center justify-end gap-1 whitespace-nowrap rounded px-1 -mx-1 tabular-nums hover:bg-muted/60",
            open && "bg-muted/60",
            activeIds.length > 0 && "text-amber-300",
            className,
          )}
          title={activeTitle || undefined}
          onMouseEnter={() => {
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (open && pinned) {
              setPinned(false);
              setOpen(false);
            } else {
              setPinned(true);
              setOpen(true);
            }
          }}
        >
          {activeDot}
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[22rem] max-w-[calc(100vw-1rem)] p-3"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
        // The content is portalled, but React events still bubble along the
        // REACT tree - i.e. into whatever the trigger is nested in (the "Your
        // World" sheet trigger in the companion app). Keep every click and
        // pointer press inside the popover to itself.
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <PaliaClockContent config={config} open={open} />
      </PopoverContent>
    </Popover>
  );
}
