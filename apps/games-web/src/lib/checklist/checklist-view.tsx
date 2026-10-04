"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, MapPin } from "lucide-react";
import {
  ChecklistImportError,
  countChecklist,
  countChecklistGroups,
  decodeChecklistShareCode,
  decodeFromBuffer,
  encodeChecklistShareCode,
  exportChecklistJson,
  filterChecklistEntries,
  getApiUrl,
  localizePath,
  mergeChecklistProgress,
  parseChecklistJson,
  setChecklistEntries,
  toggleChecklistEntry,
  translate,
} from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { ChecklistEntry, ChecklistGroup } from "./data";
import { useChecklistProgress } from "./use-checklist-progress";

type Labels = Record<string, string>;

const PAGE_SIZE = 150;

function useL(labels: Labels) {
  return useCallback(
    (key: string, fallback: string, vars?: Record<string, string>) =>
      translate(labels, `checklist.${key}`, { fallback, vars }),
    [labels],
  );
}

const CHIP = (active: boolean) =>
  `rounded px-2.5 py-1 text-xs transition-colors ${
    active
      ? "bg-amber-600/80 text-white"
      : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
  }`;
const BUTTON =
  "inline-flex h-8 items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 px-2.5 text-xs text-slate-200 hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50";

export function ProgressBar({
  done,
  total,
  percent,
  label,
}: {
  done: number;
  total: number;
  percent: number;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-amber-500 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

type RowProps = {
  entry: ChecklistEntry;
  checked: boolean;
  onToggle: (id: string) => void;
  onMap: (entry: ChecklistEntry, e: React.MouseEvent) => void;
  appName: string;
  iconsHash?: string;
  section: string;
  locale: string;
  fallbackMapHref: (entry: ChecklistEntry) => string | null;
  L: ReturnType<typeof useL>;
};

const Row = memo(function Row({
  entry,
  checked,
  onToggle,
  onMap,
  appName,
  iconsHash,
  section,
  locale,
  fallbackMapHref,
  L,
}: RowProps) {
  const mapHref = entry.mapHref ?? fallbackMapHref(entry);
  return (
    <li
      className={`flex items-center gap-2 rounded border px-2 py-1.5 transition-colors ${
        checked
          ? "border-amber-700/40 bg-amber-950/20"
          : "border-slate-800 bg-slate-900/40"
      }`}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "auto 52px",
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={
          checked
            ? L("markMissing", "Mark {{name}} as missing", { name: entry.name })
            : L("markDone", "Mark {{name}} as collected", { name: entry.name })
        }
        onClick={() => onToggle(entry.id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
            checked
              ? "border-amber-500 bg-amber-500 text-slate-950"
              : "border-slate-600 bg-slate-950"
          }`}
        >
          {checked && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
        {entry.icon ? (
          <SpriteIcon
            icon={entry.icon}
            appName={appName}
            size={32}
            iconsHash={iconsHash}
            className={checked ? "opacity-60" : ""}
          />
        ) : (
          <span className="inline-block h-8 w-8 shrink-0 rounded bg-slate-800/60" />
        )}
        <span className="min-w-0">
          <span
            className={`block truncate text-sm ${
              checked ? "text-muted-foreground" : "text-slate-100"
            }`}
          >
            {entry.name}
          </span>
          {entry.desc && (
            <span className="block truncate text-xs text-muted-foreground">
              {entry.desc}
            </span>
          )}
        </span>
      </button>
      {mapHref && (
        <a
          href={mapHref}
          onClick={(e) => onMap(entry, e)}
          title={L("showOnMapTitle", "Show {{name}} on the map", {
            name: entry.name,
          })}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded px-1.5 text-xs text-amber-300 hover:bg-slate-800 hover:text-amber-200"
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{L("showOnMap", "Map")}</span>
        </a>
      )}
      <Link
        href={localizePath(
          `/db/${section}/${encodeURIComponent(entry.id)}`,
          locale,
        )}
        prefetch={false}
        title={L("openCodexTitle", "Open {{name}} in the database", {
          name: entry.name,
        })}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded px-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
      >
        <BookOpen className="h-4 w-4" />
        <span className="hidden sm:inline">{L("codex", "Database")}</span>
      </Link>
    </li>
  );
});

/**
 * Collection checklist for one codex section: tick what you have, see your
 * progress, filter to what is missing and jump to the codex entry or the map.
 * Progress is per viewer in localStorage (see useChecklistProgress) with a
 * JSON export (every section of the game) and a per-section share code.
 */
export function ChecklistView({
  appName,
  section,
  sectionLabel,
  entries,
  groups,
  labels,
  iconsHash,
  locale,
  mapTitles,
}: {
  appName: string;
  section: string;
  sectionLabel: string;
  entries: ChecklistEntry[];
  groups: ChecklistGroup[];
  labels: Labels;
  iconsHash?: string;
  locale: string;
  /** Map name → `/maps/<title>` segment, in tile order. */
  mapTitles: Record<string, string>;
}) {
  const L = useL(labels);
  const { progress, loaded, update, storageOk } = useChecklistProgress(appName);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [missingOnly, setMissingOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Big sections (thousands of outfits) render in pages: the first page is
  // server-rendered, the rest loads as the viewer scrolls.
  const [limit, setLimit] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setLimit(PAGE_SIZE), [query, group, missingOnly]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (items) => {
        if (items.some((i) => i.isIntersecting)) {
          setLimit((l) => l + PAGE_SIZE);
        }
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  });

  const checked = useMemo(
    () => new Set(progress[section] ?? []),
    [progress, section],
  );
  const ids = useMemo(() => entries.map((e) => e.id), [entries]);
  const count = countChecklist(ids, checked);
  const groupCounts = useMemo(
    () => countChecklistGroups(entries, checked),
    [entries, checked],
  );
  const filtered = useMemo(
    () =>
      filterChecklistEntries(entries, checked, {
        query,
        group,
        missingOnly,
      }),
    [entries, checked, query, group, missingOnly],
  );

  const onToggle = useCallback(
    (id: string) => update((p) => toggleChecklistEntry(p, section, id)),
    [update, section],
  );

  const mapNames = useMemo(() => Object.keys(mapTitles), [mapTitles]);
  const mapPath = useCallback(
    (mapName: string, types: string[]) =>
      `${localizePath(
        `/maps/${encodeURIComponent(mapTitles[mapName] ?? mapName)}`,
        locale,
      )}?types=${types.map(encodeURIComponent).join(",")}`,
    [mapTitles, locale],
  );
  // Without JS (or before the lookup below) the link opens the first map.
  const fallbackMapHref = useCallback(
    (entry: ChecklistEntry) =>
      entry.types?.length && mapNames[0]
        ? mapPath(mapNames[0], entry.types)
        : null,
    [mapNames, mapPath],
  );
  const onMap = useCallback(
    async (entry: ChecklistEntry, e: React.MouseEvent) => {
      // Deep links and single-map games already point at the right map.
      if (
        entry.mapHref ||
        !entry.types?.length ||
        mapNames.length < 2 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }
      e.preventDefault();
      // Ask the search API which maps hold this entry's spawns and open the
      // first of them in tile order (same choice as the codex "On the map").
      let target = mapNames[0];
      try {
        const found = new Set<string>();
        for (const type of entry.types) {
          const res = await fetch(
            getApiUrl(appName, `type=${encodeURIComponent(type)}&summary=1`),
          );
          if (!res.ok) continue;
          const summary = decodeFromBuffer<{ count: number; maps: string[] }>(
            new Uint8Array(await res.arrayBuffer()),
          );
          for (const m of summary.maps) found.add(m || mapNames[0]);
        }
        target = mapNames.find((m) => found.has(m)) ?? target;
      } catch {
        // Fall back to the first map.
      }
      window.location.assign(mapPath(target, entry.types));
    },
    [appName, mapNames, mapPath],
  );

  const shareCode = useMemo(
    () =>
      loaded ? encodeChecklistShareCode(section, progress[section] ?? []) : "",
    [loaded, section, progress],
  );

  const exportFile = () => {
    const blob = new Blob([exportChecklistJson(appName, progress)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName}-checklists.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importText = (text: string) => {
    try {
      const incoming = parseChecklistJson(text, appName);
      const n = Object.values(incoming).reduce((s, l) => s + l.length, 0);
      update((p) => mergeChecklistProgress(p, incoming, "merge"));
      setMessage(
        L("imported", "Imported {{count}} ticked entries.", {
          count: n.toLocaleString(locale),
        }),
      );
    } catch (err) {
      if (err instanceof ChecklistImportError && err.reason === "wrong-game") {
        setMessage(
          L("importWrongGame", "That file is from another game ({{game}}).", {
            game: err.game ?? "",
          }),
        );
      } else {
        setMessage(L("importInvalid", "That is not a checklist file or code."));
      }
    }
  };

  const importCode = () => {
    const decoded = decodeChecklistShareCode(code);
    if (!decoded) {
      setMessage(L("importInvalid", "That is not a checklist file or code."));
      return;
    }
    update((p) => setChecklistEntries(p, decoded.section, decoded.ids, true));
    setCode("");
    setMessage(
      L("imported", "Imported {{count}} ticked entries.", {
        count: decoded.ids.length.toLocaleString(locale),
      }),
    );
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code stays selectable in the field.
    }
  };

  const reset = () => {
    const n = progress[section]?.length ?? 0;
    if (!n) return;
    if (
      !window.confirm(
        L("resetConfirm", "Untick all {{count}} entries of this checklist?", {
          count: n.toLocaleString(locale),
        }),
      )
    ) {
      return;
    }
    update((p) => setChecklistEntries(p, section, p[section] ?? [], false));
  };

  const progressLabel = L("progress", "{{done}} of {{total}} ({{percent}}%)", {
    done: count.done.toLocaleString(locale),
    total: count.total.toLocaleString(locale),
    percent: count.percent.toLocaleString(locale),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {sectionLabel}
          </h2>
          <span className="text-sm tabular-nums">
            {count.done.toLocaleString(locale)} /{" "}
            {count.total.toLocaleString(locale)}
          </span>
        </div>
        <ProgressBar {...count} label={progressLabel} />
        <p className="text-xs text-muted-foreground">
          {storageOk
            ? L("storageNote", "Progress is saved in this browser only.")
            : L(
                "storageBlocked",
                "Your browser blocks site storage, so your ticks will be lost when you leave. Use Export file to keep them.",
              )}
        </p>
        <details className="group text-sm">
          <summary className="cursor-pointer select-none text-xs text-amber-300 hover:text-amber-200">
            {L("backup", "Backup & share")}
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              {L(
                "backupHint",
                "The share code holds this checklist's ticks: paste it on another device or send it to a friend. The export file holds every checklist of this game.",
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={BUTTON} onClick={exportFile}>
                {L("exportFile", "Export file")}
              </button>
              <button
                type="button"
                className={BUTTON}
                onClick={() => fileRef.current?.click()}
              >
                {L("importFile", "Import file")}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) importText(await file.text());
                }}
              />
              <button
                type="button"
                className={BUTTON}
                onClick={reset}
                disabled={!checked.size}
              >
                {L("reset", "Reset this checklist")}
              </button>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">
                {L("shareCode", "Share code")}
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareCode}
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-8 min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 font-mono text-xs text-slate-300"
                />
                <button type="button" className={BUTTON} onClick={copyCode}>
                  {copied ? L("copied", "Copied") : L("copyCode", "Copy code")}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">
                {L("pasteCode", "Paste a share code")}
              </label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CL1.…"
                  className="h-8 min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 font-mono text-xs text-slate-200 outline-none focus:border-amber-700/70"
                />
                <button
                  type="button"
                  className={BUTTON}
                  onClick={importCode}
                  disabled={!code.trim()}
                >
                  {L("importCode", "Import code")}
                </button>
              </div>
            </div>
          </div>
        </details>
        {message && (
          <p role="status" className="text-xs text-amber-200">
            {message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L("search", "Search…")}
          aria-label={L("search", "Search…")}
          className="h-8 w-full rounded border border-slate-700 bg-slate-900/60 px-2.5 text-sm text-slate-200 outline-none focus:border-amber-700/70 sm:w-56"
        />
        <button
          type="button"
          aria-pressed={missingOnly}
          onClick={() => setMissingOnly((v) => !v)}
          className={CHIP(missingOnly)}
        >
          {L("missingOnly", "Missing only")}
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {L("shown", "{{count}} shown", {
            count: filtered.length.toLocaleString(locale),
          })}
        </span>
      </div>
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setGroup(null)}
            className={CHIP(group === null)}
          >
            {L("allGroups", "All")}
          </button>
          {groups.map((g) => {
            const c = groupCounts.get(g.id);
            return (
              <button
                type="button"
                key={g.id}
                onClick={() => setGroup(group === g.id ? null : g.id)}
                className={CHIP(group === g.id)}
              >
                {g.label}
                <span className="ml-1.5 tabular-nums text-slate-400">
                  {c ? `${loaded ? c.done : 0}/${c.total}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {missingOnly && count.done === count.total && !query && !group
            ? L("allDone", "Nothing missing here. Well done!")
            : L("noMatch", "No entries match.")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, limit).map((entry) => (
            <Row
              key={entry.id}
              entry={entry}
              checked={checked.has(entry.id)}
              onToggle={onToggle}
              onMap={onMap}
              appName={appName}
              iconsHash={iconsHash}
              section={section}
              locale={locale}
              fallbackMapHref={fallbackMapHref}
              L={L}
            />
          ))}
        </ul>
      )}
      {filtered.length > limit && (
        <div ref={sentinelRef} className="flex justify-center py-2">
          <button
            type="button"
            className={BUTTON}
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
          >
            {L("showMore", "Show more ({{count}} left)", {
              count: (filtered.length - limit).toLocaleString(locale),
            })}
          </button>
        </div>
      )}
    </div>
  );
}
