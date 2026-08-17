"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { matchSnippet } from "./match-snippet";

type SearchEntry = {
  id: string;
  name: string;
  type: string;
  section: string;
  href: string;
  icon?: {
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Flattened effect/props text for reverse lookups ("View Radius"). */
  text?: string;
};

const DEFAULT_TYPE_BADGE = "bg-zinc-800 text-slate-400";

// Module-level cache so the index is fetched at most once per page session
let cachedData: { entries: SearchEntry[]; iconsUrl: string } | null = null;
let fetchPromise: Promise<{ entries: SearchEntry[]; iconsUrl: string }> | null =
  null;

function fetchSearchIndex(
  locale: string,
): Promise<{ entries: SearchEntry[]; iconsUrl: string }> {
  if (cachedData) return Promise.resolve(cachedData);
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch(`/api/db/search-index?locale=${locale}`)
    .then((res) => res.json())
    .then((data) => {
      cachedData = data;
      return data;
    });
  return fetchPromise;
}

export function DbSearch({
  locale = "en",
  placeholder = "Search...",
  typeLabels,
  typeColors,
}: {
  locale?: string;
  placeholder?: string;
  /** Map of entry type → display label shown in the dropdown badge. */
  typeLabels?: Record<string, string>;
  /** Map of entry type → tailwind bg+text classes for the dropdown badge. */
  typeColors?: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [iconsUrl, setIconsUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const fuseRef = useRef<Fuse<SearchEntry> | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load search index on first interaction
  const ensureLoaded = useCallback(() => {
    if (loaded) return;
    fetchSearchIndex(locale).then((data) => {
      setEntries(data.entries);
      setIconsUrl(data.iconsUrl);
      fuseRef.current = new Fuse(data.entries, {
        keys: ["name"],
        threshold: 0.3,
      });
      setLoaded(true);
    });
  }, [loaded, locale]);

  // Fuzzy name matches first, then exact-substring matches on the flattened
  // effect text ("View Radius" → skills/artifacts granting it). Substring, not
  // fuzzy, on the long text — fuzzy over prose produces noisy false positives.
  const trimmed = query.trim();
  let results: SearchEntry[] = [];
  if (trimmed && fuseRef.current) {
    results = fuseRef.current.search(trimmed, { limit: 12 }).map((r) => r.item);
    if (trimmed.length >= 3 && results.length < 12) {
      const q = trimmed.toLowerCase();
      for (const entry of entries) {
        if (results.length >= 12) break;
        if (
          entry.text &&
          !results.includes(entry) &&
          entry.text.toLowerCase().includes(q)
        ) {
          results.push(entry);
        }
      }
    }
  }

  const navigate = useCallback(
    (entry: SearchEntry) => {
      router.push(entry.href);
      setQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [router],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === "k") || (e.key === "/" && !open)) {
        e.preventDefault();
        ensureLoaded();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, ensureLoaded]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex]);
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          data-db-search
          value={query}
          onChange={(e) => {
            ensureLoaded();
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            ensureLoaded();
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          // Responsive widths use `!` so they win over @repo/ui's
          // late-loaded plain `.w-24` utility (the page bundles two Tailwind
          // stylesheets; the library's base utility would otherwise override
          // these and keep the input collapsed on desktop).
          className="h-7 sm:h-8 w-24 sm:w-40! md:w-48! sm:focus:w-64! transition-all rounded-md border border-neutral-700 bg-zinc-800/50 pl-8 pr-4 sm:pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-amber-800/50 focus:ring-1 focus:ring-amber-800/30"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="absolute right-2 text-[10px] text-muted-foreground border border-neutral-700 rounded px-1 py-0.5 font-mono hidden sm:inline">
            /
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {open &&
        results.length > 0 &&
        (() => {
          const dropdown = (
            <div
              className={`sidebar-scroll max-h-96 overflow-auto rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-99999 ${
                isMobile
                  ? "fixed left-2 right-2 top-14"
                  : "absolute right-0 top-full mt-1 w-80"
              }`}
            >
              {results.map((entry, i) => {
                // Why did this match? Show the effect line for entries found
                // via effect text rather than their name.
                const snippet = entry.name
                  .toLowerCase()
                  .includes(trimmed.toLowerCase())
                  ? null
                  : matchSnippet(entry.text, trimmed);
                return (
                  <button
                    key={entry.id}
                    onClick={() => navigate(entry)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-zinc-800"
                        : "hover:bg-zinc-800/50"
                    }`}
                  >
                    {entry.icon && (
                      <img
                        alt=""
                        role="presentation"
                        className="shrink-0 object-none"
                        src={iconsUrl}
                        width={entry.icon.width}
                        height={entry.icon.height}
                        style={{
                          // Size the element to the icon's OWN cell (so object-none
                          // shows exactly that cell, no bleed from neighbours), then
                          // zoom to the 32px box — scaling small icons UP too, not
                          // just clamping large ones down.
                          width: entry.icon.width,
                          height: entry.icon.height,
                          objectPosition: `-${entry.icon.x}px -${entry.icon.y}px`,
                          zoom: 32 / (entry.icon.width || 64),
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {entry.name}
                      </div>
                      {snippet && (
                        <div className="text-xs text-muted-foreground truncate">
                          {snippet}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        typeColors?.[entry.type] ?? DEFAULT_TYPE_BADGE
                      }`}
                    >
                      {typeLabels?.[entry.type] ?? entry.type}
                    </span>
                  </button>
                );
              })}
            </div>
          );
          return isMobile ? createPortal(dropdown, document.body) : dropdown;
        })()}

      {/* No results */}
      {open &&
        query.trim() &&
        loaded &&
        results.length === 0 &&
        (() => {
          const noResults = (
            <div
              className={`rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl z-99999 p-4 text-center text-sm text-muted-foreground ${
                isMobile
                  ? "fixed left-2 right-2 top-14"
                  : "absolute right-0 top-full mt-1 w-80"
              }`}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          );
          return isMobile ? createPortal(noResults, document.body) : noResults;
        })()}
    </div>
  );
}
