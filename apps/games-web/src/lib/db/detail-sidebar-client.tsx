"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizePath } from "@repo/lib";
import { Search, X } from "lucide-react";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SidebarGroup = {
  label: string;
  items: { id: string; name: string; icon?: IconSprite }[];
};

/**
 * Sidebar lists already loaded in this tab, keyed by request URL.
 *
 * The list is identical for every entry in a section, so without this, moving
 * between two entries would refetch it. Module scope (not state) so it survives
 * the component unmounting on navigation. `inflight` dedupes concurrent loads.
 */
const groupsCache = new Map<string, SidebarGroup[]>();
const inflight = new Map<string, Promise<SidebarGroup[]>>();

function loadGroups(src: string): Promise<SidebarGroup[]> {
  const cached = groupsCache.get(src);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(src);
  if (pending) return pending;
  const p = fetch(src)
    .then((r) => (r.ok ? r.json() : { groups: [] }))
    .then((d: { groups?: SidebarGroup[] }) => {
      const groups = d.groups ?? [];
      groupsCache.set(src, groups);
      return groups;
    })
    .catch(() => [] as SidebarGroup[])
    .finally(() => {
      inflight.delete(src);
    });
  inflight.set(src, p);
  return p;
}

export function DetailSidebarClient({
  groups: serverGroups,
  src,
  section,
  locale = "en",
}: {
  /** Server-built list. Bespoke section layouts still pass this directly. */
  groups?: SidebarGroup[];
  /**
   * Load the list from this URL in the browser instead of receiving it as
   * server props. Used by the generic `/db/<section>` layout, where the list can
   * run to thousands of entries — inlining it made every detail page under the
   * section megabytes of HTML. Ignored when `groups` is passed.
   */
  src?: string;
  /**
   * URL stem to prefix item links with. Accepts either:
   *   - a bare segment ("units"), expanded to "/db/units/<id>"
   *   - a full path ("/remnants" or "/db/remnants"), used verbatim with
   *     "/<id>" appended.
   *
   * The path form lets games keep legacy URLs (e.g. once-human's
   * `/db/remnants/<id>`) without forcing every consumer to think in
   * "section segments".
   */
  section: string;
  locale?: string;
}) {
  // Build the per-item base path once: leading slash means the caller
  // passed a full stem; anything else is a bare segment under /db/.
  const itemBase = section.startsWith("/") ? section : `/db/${section}`;
  const pathname = usePathname() ?? "/";
  const activeId = pathname.split("/").pop() ?? "";
  const [filter, setFilter] = useState("");

  // When loading client-side, start from anything this tab already fetched so a
  // same-section navigation paints the list immediately with no flash.
  const [loaded, setLoaded] = useState<SidebarGroup[] | null>(() =>
    serverGroups ? null : src ? (groupsCache.get(src) ?? null) : [],
  );
  useEffect(() => {
    if (serverGroups || !src || groupsCache.has(src)) return;
    let cancelled = false;
    void loadGroups(src).then((g) => {
      if (!cancelled) setLoaded(g);
    });
    return () => {
      cancelled = true;
    };
  }, [serverGroups, src]);

  const groups = serverGroups ?? loaded;
  const isLoading = groups === null;

  const query = filter.toLowerCase().trim();
  const filteredGroups = !groups
    ? []
    : query
      ? groups
          .map((g) => ({
            ...g,
            items: g.items.filter((i) => i.name.toLowerCase().includes(query)),
          }))
          .filter((g) => g.items.length > 0)
      : groups;

  return (
    <nav className="flex flex-col h-full">
      <div className="shrink-0 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="w-full h-7 rounded border border-neutral-700 bg-zinc-800/50 pl-7 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-800/50"
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="sidebar-scroll overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {group.label && (
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1 px-1.5">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <Link
                  key={item.id}
                  href={localizePath(`${itemBase}/${item.id}`, locale)}
                  prefetch={false}
                  className={`flex items-center gap-2 px-1.5 py-1.5 rounded transition-colors ${
                    isActive
                      ? "bg-amber-900/30 text-amber-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-zinc-800/50"
                  }`}
                >
                  {item.icon && (
                    <img
                      alt=""
                      role="presentation"
                      className="shrink-0 object-none"
                      src={item.icon.url}
                      width={item.icon.width}
                      height={item.icon.height}
                      style={{
                        // force width+height in CSS (global `img{height:auto}`
                        // would recompute height from the sheet ratio → bleed)
                        width: item.icon.width,
                        height: item.icon.height,
                        objectPosition: `-${item.icon.x}px -${item.icon.y}px`,
                        // scale to the 20px slot — small icons UP too, so a 9px
                        // sprite fills the row like a 20px one (uniform sizing)
                        zoom: 20 / (item.icon.width || 64),
                      }}
                    />
                  )}
                  <span className="truncate text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
        {isLoading && (
          <div
            className="space-y-1 px-1.5 py-1"
            aria-busy="true"
            aria-label="Loading list"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-6 rounded bg-zinc-800/40 animate-pulse"
              />
            ))}
          </div>
        )}
        {!isLoading && query && filteredGroups.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4">
            No matches
          </div>
        )}
      </div>
    </nav>
  );
}
