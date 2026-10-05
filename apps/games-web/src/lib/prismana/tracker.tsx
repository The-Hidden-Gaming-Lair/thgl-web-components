"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, MapPin } from "lucide-react";
import {
  guessRegion,
  prismanaRotation,
  setChecklistEntries,
  splitDuration,
  translate,
} from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { useChecklistProgress } from "@/lib/checklist/use-checklist-progress";
import type { PrismanaRef, PrismanaSourceView, PrismanaView } from "./data";

/** Progress lives in the game's checklist storage under its own section. */
const SECTION = "prismana";
const REGION_KEY = (game: string) => `thgl-prismana-region:${game}`;
const LINK = "text-amber-300 underline underline-offset-2 hover:text-amber-200";

type Props = {
  view: PrismanaView;
  /** UI strings (`prismana.*` + the shared `activities.*` duration/region keys). */
  dict: Record<string, string>;
  appName: string;
  iconsHash?: string;
  locale: string;
};

function EntityIcon({
  entity,
  size,
  appName,
  iconsHash,
}: {
  entity: PrismanaRef;
  size: number;
  appName: string;
  iconsHash?: string;
}) {
  return entity.icon ? (
    <SpriteIcon
      icon={entity.icon}
      appName={appName}
      iconsHash={iconsHash}
      size={size}
    />
  ) : (
    <span
      className="inline-block shrink-0 rounded bg-muted"
      style={{ width: size, height: size }}
    />
  );
}

function EntityName({ entity }: { entity: PrismanaRef }) {
  return entity.href ? (
    <Link href={entity.href} prefetch={false} className={LINK}>
      {entity.name}
    </Link>
  ) : (
    <span>{entity.name}</span>
  );
}

/**
 * Prismana tracker island: the hidden-area rotation for the viewer's server
 * region with a live countdown, the rotation schedule, and every Prismana
 * with its sources and a "collected" tick (localStorage, per browser).
 * Server-rendered without the clock; the current week fills in after mount.
 */
export function PrismanaTracker({
  view,
  dict,
  appName,
  iconsHash,
  locale,
}: Props) {
  const L = (key: string, vars?: Record<string, string>) =>
    translate(dict, key, vars ? { vars } : undefined);
  const P = (key: string, vars?: Record<string, string>) =>
    L(`prismana.${key}`, vars);
  const { progress, loaded, update } = useChecklistProgress(appName);
  const owned = useMemo(() => new Set(progress[SECTION] ?? []), [progress]);
  const [now, setNow] = useState<number | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [hideOwned, setHideOwned] = useState(false);

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(REGION_KEY(appName));
    } catch {
      /* storage blocked */
    }
    setRegionId(
      view.regions.some((r) => r.id === saved)
        ? saved
        : view.regions.length
          ? guessRegion(
              view.regions,
              -new Date(t).getTimezoneOffset(),
              t,
              Intl.DateTimeFormat().resolvedOptions().timeZone,
            ).id
          : null,
    );
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [appName, view.regions]);

  const pickRegion = (id: string) => {
    setRegionId(id);
    try {
      window.localStorage.setItem(REGION_KEY(appName), id);
    } catch {
      /* storage blocked */
    }
  };

  const region = view.regions.find((r) => r.id === regionId);
  const rotation =
    now !== null && region
      ? prismanaRotation(view.weeks, region.id, now)
      : undefined;
  const duration = (ms: number) => {
    const { d, h, m, s } = splitDuration(ms);
    if (d) return L("activities.durationDH", { d: `${d}`, h: `${h}` });
    if (h) return L("activities.durationHM", { h: `${h}`, m: `${m}` });
    return L("activities.durationMS", { m: `${m}`, s: `${s}` });
  };
  const date = (sec: number) =>
    new Date(sec * 1000).toLocaleString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const toggle = (id: string) =>
    update((prev) => setChecklistEntries(prev, SECTION, [id], !owned.has(id)));
  const done = view.entries.filter((e) => owned.has(e.id)).length;
  const sectionTitle =
    "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  const source = (s: PrismanaSourceView, i: number) => {
    switch (s.kind) {
      case "flow":
        return (
          <li key={i}>
            <Link href={s.href} prefetch={false} className={LINK}>
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {P("src.flow")}
            </Link>
          </li>
        );
      case "hidden":
        return (
          <li key={i}>
            <Link href={s.href} prefetch={false} className={LINK}>
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              {P("src.hidden", { weeks: s.weeks.join(", ") })}
            </Link>
          </li>
        );
      case "egg":
        return (
          <li key={i} className="flex flex-wrap items-center gap-1">
            <EntityIcon
              appName={appName}
              iconsHash={iconsHash}
              entity={s.egg}
              size={20}
            />
            <EntityName entity={s.egg} />
            <span className="text-muted-foreground">
              – {s.sources.join(" · ")}
            </span>
          </li>
        );
      case "evolve":
        return (
          <li key={i} className="flex flex-wrap items-center gap-1">
            {P("src.evolve")}{" "}
            <EntityIcon
              appName={appName}
              iconsHash={iconsHash}
              entity={s.from}
              size={20}
            />
            <EntityName entity={s.from} />
          </li>
        );
      case "rv":
        return <li key={i}>{s.text}</li>;
    }
  };

  return (
    <div className="space-y-8 text-left">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitle}>{P("weekTitle")}</h2>
          {view.regions.length > 1 && (
            <label className="flex items-center gap-2 text-sm">
              {L("activities.region")}
              <select
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
                value={region?.id ?? ""}
                onChange={(e) => pickRegion(e.target.value)}
              >
                {view.regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {rotation && (rotation.current || rotation.next) ? (
          <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-950/20 p-3">
            {(rotation.current ?? rotation.next)!.species.map((sp) => (
              <div key={sp.id} className="flex flex-wrap items-center gap-3">
                <EntityIcon
                  appName={appName}
                  iconsHash={iconsHash}
                  entity={sp}
                  size={48}
                />
                <div className="space-y-1">
                  <div className="text-lg font-medium">
                    <EntityName entity={sp} />
                  </div>
                  <Link href={sp.mapHref} prefetch={false} className={LINK}>
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    {P("showOnMap")}
                  </Link>
                </div>
              </div>
            ))}
            <p className="text-sm">
              {rotation.current
                ? P("endsIn", { time: duration(rotation.msLeft ?? 0) })
                : P("startsIn", { time: duration(rotation.msLeft ?? 0) })}
            </p>
          </div>
        ) : (
          now !== null && (
            <p className="text-sm text-muted-foreground">{P("weekNone")}</p>
          )
        )}
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{P("scheduleTitle")}</h3>
          <ul className="space-y-1 text-sm">
            {view.weeks.map((w) => {
              const isNow = rotation?.current?.week === w.week;
              const start = region ? w.start[region.id] : undefined;
              const end = region ? w.end[region.id] : undefined;
              return (
                <li
                  key={w.week}
                  className={`flex flex-wrap items-center gap-2 rounded px-2 py-1 ${
                    isNow ? "bg-amber-950/30" : ""
                  }`}
                >
                  <span className="w-20 shrink-0 text-muted-foreground">
                    {P("week", { n: String(w.week) })}
                  </span>
                  <span className="w-64 shrink-0 tabular-nums">
                    {start !== undefined && end !== undefined && now !== null
                      ? `${date(start)} – ${date(end)}`
                      : ""}
                  </span>
                  {w.species.map((sp) => (
                    <Link
                      key={sp.id}
                      href={sp.mapHref}
                      prefetch={false}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <EntityIcon
                        appName={appName}
                        iconsHash={iconsHash}
                        entity={sp}
                        size={24}
                      />
                      {sp.name}
                    </Link>
                  ))}
                  {isNow && (
                    <span className="text-xs text-amber-300">{P("now")}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">{P("scheduleHint")}</p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitle}>
            {P("listTitle", { count: String(view.entries.length) })}
          </h2>
          <div className="flex items-center gap-3 text-sm">
            {loaded && (
              <span>
                {P("owned", {
                  done: String(done),
                  total: String(view.entries.length),
                })}
              </span>
            )}
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={hideOwned}
                onChange={(e) => setHideOwned(e.target.checked)}
              />
              {P("hideOwned")}
            </label>
          </div>
        </div>
        <ul className="grid gap-2 md:grid-cols-2">
          {view.entries
            .filter((e) => !hideOwned || !owned.has(e.id))
            .map((e) => {
              const has = owned.has(e.id);
              return (
                <li
                  key={e.id}
                  className={`flex gap-3 rounded-md border p-2 ${
                    has
                      ? "border-emerald-700/60 bg-emerald-950/20"
                      : "border-slate-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(e.id)}
                    aria-pressed={has}
                    aria-label={P(has ? "markNotOwned" : "markOwned", {
                      name: e.name,
                    })}
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                      has
                        ? "border-emerald-500 bg-emerald-600 text-white"
                        : "border-slate-600"
                    }`}
                  >
                    {has && <Check className="h-4 w-4" />}
                  </button>
                  <EntityIcon
                    appName={appName}
                    iconsHash={iconsHash}
                    entity={e}
                    size={48}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="font-medium">
                      <EntityName entity={e} />
                    </div>
                    {e.sources.length ? (
                      <ul className="space-y-0.5 text-sm">
                        {e.sources.map(source)}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {P("src.none")}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
      </section>
    </div>
  );
}
