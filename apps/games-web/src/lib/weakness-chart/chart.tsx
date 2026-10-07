"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  damageMultiplier,
  formatDamagePercent,
  localizePath,
  sortCreaturesByType,
  translate,
  weaknessLevel,
  type WeaknessData,
  type WeaknessLevel,
} from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import type { WeaknessEntry, WeaknessNames } from "./data";

const LEVEL_CLASS: Record<WeaknessLevel, string> = {
  "very-weak": "bg-emerald-500/30 text-emerald-200 font-semibold",
  weak: "bg-emerald-500/15 text-emerald-300",
  normal: "text-muted-foreground/40",
  resistant: "bg-rose-500/15 text-rose-300",
  "very-resistant": "bg-rose-500/30 text-rose-200 font-semibold",
};

/** Weakness Chart island: every creature × damage type, searchable and sortable per column. */
export function WeaknessChart({
  data,
  names,
  labels,
  appName,
  iconsHash,
  locale,
}: {
  data: WeaknessData;
  names: WeaknessNames;
  labels: Record<string, string>;
  appName: string;
  iconsHash?: string;
  locale: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ type: string; desc: boolean } | null>(
    null,
  );

  // Shareable sort: ?sort=<type> (weakest first) or ?sort=-<type> (most resistant first).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("sort");
    if (!param) return;
    const type = param.replace(/^-/, "");
    if (names.types.some((t) => t.typeId === type))
      setSort({ type, desc: !param.startsWith("-") });
  }, [names.types]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (sort)
      url.searchParams.set("sort", `${sort.desc ? "" : "-"}${sort.type}`);
    else url.searchParams.delete("sort");
    window.history.replaceState(null, "", url);
  }, [sort]);

  const nameOf = useMemo(
    () => new Map(names.creatures.map((c) => [c.id, c])),
    [names.creatures],
  );
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const ids = names.creatures
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .map((c) => c.id);
    const ordered = sort
      ? sortCreaturesByType(
          data,
          ids,
          sort.type,
          (id) => nameOf.get(id)?.name ?? id,
          sort.desc,
        )
      : ids;
    return ordered.map((id) => nameOf.get(id)!);
  }, [data, names.creatures, nameOf, query, sort]);

  const toggleSort = (type: string) =>
    setSort((s) =>
      s?.type !== type
        ? { type, desc: true }
        : s.desc
          ? { type, desc: false }
          : null,
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={translate(labels, "weak.search")}
          className="h-9 w-full max-w-xs rounded-md border bg-background px-3 text-sm"
        />
        <span className="text-xs text-muted-foreground">
          {translate(labels, "weak.sortHint")}
        </span>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 z-10 bg-background p-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => setSort(null)}
                  className="hover:text-amber-300"
                >
                  {translate(labels, "weak.creature")}
                  {sort === null ? " ▲" : ""}
                </button>
              </th>
              {names.types.map((t) => {
                const active = sort?.type === t.typeId;
                return (
                  <th key={t.typeId} className="p-1 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort(t.typeId)}
                      title={t.desc ? `${t.name}: ${t.desc}` : t.name}
                      aria-label={t.name}
                      className={`flex w-full min-w-12 flex-col items-center gap-0.5 rounded px-1 py-1 text-[11px] leading-tight hover:bg-accent ${active ? "bg-accent text-amber-300" : ""}`}
                    >
                      {t.icon && (
                        <SpriteIcon
                          icon={t.icon}
                          appName={appName}
                          iconsHash={iconsHash}
                          size={24}
                        />
                      )}
                      <span>
                        {t.name}
                        {active ? (sort.desc ? " ▼" : " ▲") : ""}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <th className="sticky left-0 z-10 bg-background p-1 text-left font-normal">
                  <EntryLink
                    entry={c}
                    appName={appName}
                    iconsHash={iconsHash}
                    locale={locale}
                  />
                </th>
                {names.types.map((t) => {
                  const m = damageMultiplier(data, c.id, t.typeId);
                  return (
                    <td
                      key={t.typeId}
                      title={`${c.name} · ${t.name}: ×${m}`}
                      className={`p-1 text-center text-xs tabular-nums ${LEVEL_CLASS[weaknessLevel(m)]}`}
                    >
                      {formatDamagePercent(m) || "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {translate(labels, "weak.noMatch")}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {translate(labels, "weak.legend")}
      </p>
    </div>
  );
}

/** Icon + name linking to the entry's codex page. */
export function EntryLink({
  entry,
  appName,
  iconsHash,
  locale,
  size = 24,
}: {
  entry: WeaknessEntry;
  appName: string;
  iconsHash?: string;
  locale: string;
  size?: number;
}) {
  return (
    <Link
      href={localizePath(`/db/${entry.section}/${entry.id}`, locale)}
      prefetch={false}
      className="flex items-center gap-2 whitespace-nowrap rounded px-1 py-0.5 hover:text-amber-300"
    >
      {entry.icon ? (
        <SpriteIcon
          icon={entry.icon}
          appName={appName}
          iconsHash={iconsHash}
          size={size}
        />
      ) : (
        <span
          className="inline-block shrink-0 rounded bg-muted"
          style={{ width: size, height: size }}
        />
      )}
      <span>{entry.name}</span>
    </Link>
  );
}
