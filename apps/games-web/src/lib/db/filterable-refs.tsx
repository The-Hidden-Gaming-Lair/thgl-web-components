"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import { SpriteIcon } from "@/lib/db/sprite-icon";

export type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type FilterableRef = {
  id: string;
  section: string;
  name: string;
  group?: string;
  tooltip?: string;
  count?: number;
  icon?: IconSprite;
};

/**
 * A cross-link ref section with a text filter and (when the refs carry a
 * `group`) class/category filter chips. Used for large sections like a boss's
 * dropped uniques. Server-rendered sections keep the plain `refLinks` list.
 */
export function FilterableRefs({
  items,
  appName,
  iconsHash,
  locale,
}: {
  items: FilterableRef[];
  appName: string;
  iconsHash?: string;
  locale: string;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);

  const groups = useMemo(
    () =>
      Array.from(
        new Set(items.map((i) => i.group).filter((g): g is string => !!g)),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!group || i.group === group) &&
        (!q || i.name.toLowerCase().includes(q)),
    );
  }, [items, query, group]);

  // Bucket the filtered items under their group (first-seen order).
  const buckets = useMemo(() => {
    const out: { label: string; items: FilterableRef[] }[] = [];
    for (const r of filtered) {
      const label = r.group ?? "";
      let b = out.find((x) => x.label === label);
      if (!b) out.push((b = { label, items: [] }));
      b.items.push(r);
    }
    return out;
  }, [filtered]);

  const chip = (active: boolean) =>
    `rounded px-2 py-0.5 text-[11px] transition-colors ${
      active
        ? "bg-amber-600/80 text-white"
        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
    }`;

  const pill = (r: FilterableRef) => (
    <Link
      key={`${r.section}/${r.id}`}
      href={localizePath(`/db/${r.section}/${r.id}`, locale)}
      prefetch={false}
      className="group/tip relative inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/60 py-1 pr-2.5 text-xs hover:border-amber-700/70 hover:bg-slate-900 transition-colors"
      style={{ paddingLeft: r.icon ? 4 : 10 }}
    >
      {r.icon && (
        <SpriteIcon
          icon={r.icon}
          appName={appName}
          size={20}
          iconsHash={iconsHash}
        />
      )}
      <span className="text-slate-200">{r.name}</span>
      {typeof r.count === "number" && r.count > 1 && (
        <span className="font-mono text-muted-foreground">×{r.count}</span>
      )}
      {r.tooltip && (
        <span className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-64 max-w-[80vw] whitespace-normal rounded border border-slate-600 bg-slate-950 px-2.5 py-1.5 text-[11px] font-normal normal-case leading-snug text-slate-200 shadow-xl group-hover/tip:block">
          {r.tooltip}
        </span>
      )}
    </Link>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter items…"
          className="h-7 w-40 rounded border border-slate-700 bg-slate-900/60 px-2 text-xs text-slate-200 outline-none focus:border-amber-700/70"
        />
        {groups.length > 1 && (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setGroup(null)}
              className={chip(group === null)}
            >
              All
            </button>
            {groups.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGroup(g)}
                className={chip(group === g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {buckets.length === 0 ? (
        <div className="text-xs text-muted-foreground">No items match.</div>
      ) : (
        <div className="space-y-3">
          {buckets.map((b) => (
            <div key={b.label}>
              {b.label && groups.length > 1 && group === null && (
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-500/80">
                  {b.label}
                </div>
              )}
              <div className="flex flex-wrap gap-2">{b.items.map(pill)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
