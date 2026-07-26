"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { localizePath } from "@repo/lib";

export type DbSearchItem = {
  id: string;
  name: string;
  /** Section slug used in the /db/<section>/<id> link. */
  section: string;
  /** Short section label shown as a tag on the result. */
  sectionLabel: string;
};

/**
 * Global database search — filters every entry across all sections by name and
 * links straight to its detail page. Rendered on the /db landing.
 */
export function DbGlobalSearch({
  items,
  locale,
  placeholder = "Search the database…",
}: {
  items: DbSearchItem[];
  locale: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const starts: DbSearchItem[] = [];
    const contains: DbSearchItem[] = [];
    for (const it of items) {
      const n = it.name.toLowerCase();
      if (n.startsWith(q)) starts.push(it);
      else if (n.includes(q)) contains.push(it);
      if (starts.length >= 50) break;
    }
    return [...starts, ...contains].slice(0, 50);
  }, [query, items]);

  const open = query.trim().length >= 2;

  return (
    <div className="relative mt-3 max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded border border-slate-700 bg-slate-900/60 px-3 text-sm text-slate-200 outline-none focus:border-amber-700/70"
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-96 w-full overflow-y-auto rounded border border-slate-700 bg-slate-950 shadow-xl">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matches.
            </div>
          ) : (
            results.map((r) => (
              <Link
                key={`${r.section}/${r.id}`}
                href={localizePath(`/db/${r.section}/${r.id}`, locale)}
                prefetch={false}
                className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm hover:bg-slate-800/60"
              >
                <span className="truncate text-slate-200">{r.name}</span>
                <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  {r.sectionLabel}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
