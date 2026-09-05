"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";
import { SpriteIcon } from "./sprite-icon";
import { EntityTooltip } from "./entity-tooltip";
import { matchSnippet } from "./match-snippet";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GridItem = {
  id: string;
  name: string;
  groupId: string;
  groupLabel: string;
  icon?: IconSprite;
  /** Flattened effect/props text for reverse lookups ("Ranged Offence"). */
  text?: string;
};

/**
 * Client list grid with a text filter + category (group) chips. Used by the
 * generic DB section list page so large sets (uniques, aspects, …) are
 * searchable/filterable like the reference sites. Names + group labels are
 * resolved server-side and passed in. The filter also matches each item's
 * effect text, so "Ranged Offence" lists every entry granting it (with the
 * matching effect line shown under the name).
 */
export function FilterableEntityGrid({
  items,
  section,
  locale = "en",
  iconsHash,
  appName,
}: {
  items: GridItem[];
  section: string;
  locale?: string;
  iconsHash?: string;
  appName: string;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);

  // Distinct groups (first-seen order) with counts.
  const groups = useMemo(() => {
    const m = new Map<string, { label: string; count: number }>();
    for (const it of items) {
      const g = m.get(it.groupId);
      if (g) g.count++;
      else m.set(it.groupId, { label: it.groupLabel, count: 1 });
    }
    return [...m.entries()].map(([id, v]) => ({ id, ...v }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (it) =>
        (!group || it.groupId === group) &&
        (!q ||
          it.name.toLowerCase().includes(q) ||
          it.text?.toLowerCase().includes(q)),
    );
  }, [items, query, group]);

  // Bucket filtered items by group (first-seen order).
  const buckets = useMemo(() => {
    const out: { id: string; label: string; items: GridItem[] }[] = [];
    for (const it of filtered) {
      let b = out.find((x) => x.id === it.groupId);
      if (!b)
        out.push((b = { id: it.groupId, label: it.groupLabel, items: [] }));
      b.items.push(it);
    }
    return out;
  }, [filtered]);

  const chip = (active: boolean) =>
    `rounded px-2.5 py-1 text-xs transition-colors ${
      active
        ? "bg-amber-600/80 text-white"
        : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
    }`;

  const showGroupHeaders = groups.length > 1 && group === null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or effect…"
          className="h-8 w-48 rounded border border-slate-700 bg-slate-900/60 px-2.5 text-sm text-slate-200 outline-none focus:border-amber-700/70"
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
                key={g.id}
                onClick={() => setGroup(g.id)}
                className={chip(group === g.id)}
              >
                {g.label}
                <span className="ml-1.5 text-slate-400">{g.count}</span>
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length.toLocaleString()} shown
        </span>
      </div>

      {buckets.length === 0 ? (
        <div className="text-sm text-muted-foreground">No entries match.</div>
      ) : (
        <div className="space-y-6">
          {buckets.map((b) => (
            <div key={b.id}>
              {showGroupHeaders && (
                <h2 className="mb-3 border-b border-slate-800 pb-1 text-sm uppercase tracking-wider text-muted-foreground">
                  {b.label}
                  <span className="ml-2 text-slate-500">{b.items.length}</span>
                </h2>
              )}
              <div className="grid grid-cols-2 gap-1 lg:grid-cols-3">
                {b.items.map((item) => {
                  // When the item matched via effect text (not its name), show
                  // the matching effect line so the result explains itself.
                  const q = query.trim();
                  const snippet =
                    q && !item.name.toLowerCase().includes(q.toLowerCase())
                      ? matchSnippet(item.text, q)
                      : null;
                  return (
                    <EntityTooltip
                      key={item.id}
                      entityId={item.id}
                      locale={locale}
                    >
                      <Link
                        href={localizePath(`/db/${section}/${item.id}`, locale)}
                        prefetch={false}
                        className="group flex w-full items-center gap-2.5 rounded px-2.5 py-2 transition-colors hover:bg-zinc-800/50"
                      >
                        {item.icon && (
                          <SpriteIcon
                            icon={item.icon}
                            appName={appName}
                            size={28}
                            iconsHash={iconsHash}
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate transition-colors group-hover:text-amber-400">
                            {item.name}
                          </span>
                          {snippet && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {snippet}
                            </span>
                          )}
                        </span>
                      </Link>
                    </EntityTooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
