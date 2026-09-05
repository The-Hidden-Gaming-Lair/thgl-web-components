"use client";

import { cn, getIconsUrl } from "@repo/lib";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ArrowLeft, Circle, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useCoordinates, useT } from "../(providers)";
import gameIcons from "./icons.json";

type Icon = {
  name: string;
  url: string;
  author?: string;
  filterId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Category = {
  tag: string;
  icons: Icon[];
};

// Flattened icon entry used for searching across all categories.
type SearchEntry = {
  icon: Icon;
  tag: string;
  // Lower-cased "name tag" haystack, precomputed once.
  haystack: string;
};

const MAX_SEARCH_RESULTS = 160;

const SCROLLBAR_CLASSES =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ring/50 [&::-webkit-scrollbar-track]:bg-transparent";

// Uniform icon grid cell used by both the search results and the category
// view: every icon sits centered in an equal square, so rows stay tight and
// aligned no matter how the sprite cells are sized.
const ICON_GRID_CLASSES =
  "grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] content-start gap-0.5 px-2 pb-2";

function IconButton({
  icon,
  appName,
  iconsPath,
  title,
  selected,
  onClick,
}: {
  icon: Icon;
  appName: string;
  iconsPath: string;
  title: string;
  selected?: boolean;
  onClick: () => void;
}) {
  const src = appName ? getIconsUrl(appName, icon.url, iconsPath) : icon.url;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex h-10 items-center justify-center overflow-hidden rounded-md transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        selected && "bg-accent ring-1 ring-ring",
      )}
    >
      {icon.width !== 0 ? (
        <img
          src={src}
          alt={icon.name}
          className="object-none shrink-0"
          width={icon.width}
          height={icon.height}
          style={{
            width: icon.width,
            height: icon.height,
            objectPosition: `-${icon.x}px -${icon.y}px`,
            // adaptive: uniform ~32px box by the icon's own width
            // (cells are packed at native size now, not a fixed 64px).
            zoom: 32 / (icon.width || 64),
          }}
        />
      ) : (
        <img src={src} alt={icon.name} loading="lazy" className="h-6 w-6" />
      )}
    </button>
  );
}

export function IconPicker({
  appName,
  value,
  onChange,
  className,
  iconsPath,
}: {
  appName: string;
  value: {
    name: string;
    url: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  } | null;
  onChange: (value: Icon | null) => void;
  className?: string;
  iconsPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<Category | null>(null);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useT();
  const { filters } = useCoordinates();

  const categories = useMemo<Category[]>(() => {
    const appIcons: Category = {
      tag: "App Specific",
      icons: Object.values(
        filters.reduce(
          (acc, filter) => {
            filter.values.forEach((value) => {
              const name = t(value.id);
              if (acc[name]) {
                return;
              }

              if (typeof value.icon === "string") {
                acc[name] = {
                  name: name,
                  filterId: value.id,
                  x: 0,
                  y: 0,
                  width: 0,
                  height: 0,
                  url: `/icons/${value.icon}`,
                };
              } else {
                acc[name] = {
                  ...value.icon,
                  url: `/icons/${value.icon.url}`,
                  name: name,
                  filterId: value.id,
                };
              }
            });
            return acc;
          },
          {} as Record<string, Icon>,
        ),
      ),
    };
    return [appIcons, ...gameIcons.flat()];
  }, [filters, t]);

  const searchEntries = useMemo<SearchEntry[]>(
    () =>
      categories.flatMap((category) => {
        const tagLower = category.tag.toLowerCase();
        return category.icons.map((icon) => ({
          icon,
          tag: category.tag,
          haystack: `${icon.name.toLowerCase()} ${tagLower}`,
        }));
      }),
    [categories],
  );

  const trimmedQuery = query.trim().toLowerCase();
  const searchResults = useMemo<SearchEntry[] | null>(() => {
    if (!trimmedQuery) {
      return null;
    }
    // Every whitespace-separated token must match the icon name or its
    // category, so e.g. "fire sword" narrows instead of unioning.
    const tokens = trimmedQuery.split(/\s+/);
    return searchEntries.filter((entry) =>
      tokens.every((token) => entry.haystack.includes(token)),
    );
  }, [trimmedQuery, searchEntries]);

  const selectIcon = (icon: Icon | null) => {
    onChange(icon);
    setOpen(false);
  };

  // Highlight the currently applied icon when browsing (same sprite cell).
  const isSelected = (icon: Icon) =>
    value !== null &&
    value.url === icon.url &&
    (value.x ?? 0) === icon.x &&
    (value.y ?? 0) === icon.y;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          // Start every session at the category overview.
          setQuery("");
          setSelection(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <div className="w-full flex items-center gap-2">
            {value ? (
              value.width ? (
                <img
                  src={getIconsUrl(appName, value.url, iconsPath)}
                  alt={value.name}
                  className="object-none"
                  width={value.width}
                  height={value.height}
                  style={{
                    width: value.width,
                    height: value.height,
                    objectPosition: `-${value.x}px -${value.y}px`,
                    // adaptive: uniform ~19px box by the icon's own width (cells
                    // are packed at native size now, not a fixed 64px).
                    zoom: 19 / (value.width || 64),
                  }}
                />
              ) : (
                <img
                  src={getIconsUrl(appName, value.url, iconsPath)}
                  alt={value.name}
                  loading="lazy"
                  className="h-4 w-4"
                />
              )
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <div className="truncate flex-1">
              {value ? value.name : "Pick an icon"}
            </div>
          </div>
        </Button>
      </DialogTrigger>
      {/* A centered modal instead of an anchored popover: the picker needs real
          height for its icon grid, and an anchored popover gets squeezed to
          near-zero when the trigger sits low in a small window. */}
      <DialogPortal>
        <DialogOverlay className="z-990999 bg-black/50" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[8dvh] z-990999 flex max-h-[min(80dvh,36rem)] w-[min(92vw,32rem)] -translate-x-1/2 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onOpenAutoFocus={(event) => {
            // Radix focuses the first focusable element (the close button);
            // the search input is what the user wants to type into.
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">Pick an icon</DialogTitle>
          <DialogDescription className="sr-only">
            Search all icons by name or browse them by category.
          </DialogDescription>
          <DialogPrimitive.Close className="absolute right-3 top-3.5 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          <div className="flex items-center border-b pl-3 pr-10 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={inputRef}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search icons…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                // Typing always searches across ALL categories, so leave the
                // category view to show the global results.
                if (event.target.value) {
                  setSelection(null);
                }
              }}
            />
          </div>
          {searchResults ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="px-3 pt-3 pb-1.5 text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                {searchResults.length === 0
                  ? "No icon found"
                  : searchResults.length > MAX_SEARCH_RESULTS
                    ? `Showing ${MAX_SEARCH_RESULTS} of ${searchResults.length} — keep typing to narrow`
                    : `${searchResults.length} icon${searchResults.length === 1 ? "" : "s"}`}
              </div>
              <div
                className={cn(
                  ICON_GRID_CLASSES,
                  "flex-1 min-h-0 overflow-y-auto",
                  SCROLLBAR_CLASSES,
                )}
              >
                {searchResults
                  .slice(0, MAX_SEARCH_RESULTS)
                  .map(({ icon, tag }, index) => (
                    <IconButton
                      key={`${tag}-${icon.name}-${icon.author ?? ""}-${index}`}
                      icon={icon}
                      appName={appName}
                      iconsPath={iconsPath}
                      title={`${icon.name} · ${tag}${icon.author ? ` (made by ${icon.author})` : ""}`}
                      selected={isSelected(icon)}
                      onClick={() => selectIcon(icon)}
                    />
                  ))}
              </div>
            </div>
          ) : selection ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-baseline justify-between px-3 pt-3 pb-1.5 shrink-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {selection.tag} · {selection.icons.length}
                </div>
                <button
                  type="button"
                  className="flex gap-1 items-center text-xs text-primary underline-offset-4 hover:underline"
                  onClick={() => setSelection(null)}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>All categories</span>
                </button>
              </div>
              <div
                className={cn(
                  ICON_GRID_CLASSES,
                  "flex-1 min-h-0 overflow-y-auto",
                  SCROLLBAR_CLASSES,
                )}
              >
                {selection.icons.map((icon, index) => (
                  <IconButton
                    key={`${icon.name}-${icon.author ?? ""}-${index}`}
                    icon={icon}
                    appName={appName}
                    iconsPath={iconsPath}
                    title={`${icon.name}${icon.author ? ` (made by ${icon.author})` : ""}`}
                    selected={isSelected(icon)}
                    onClick={() => selectIcon(icon)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="px-3 pt-3 pb-1.5 text-xs uppercase tracking-wider text-muted-foreground shrink-0">
                Categories
              </div>
              <div
                className={cn(
                  "grid content-start sm:grid-cols-2 gap-x-1 px-2 pb-2 flex-1 min-h-0 overflow-y-auto",
                  SCROLLBAR_CLASSES,
                )}
              >
                {categories.map((category) => (
                  <button
                    key={category.tag}
                    type="button"
                    className="flex w-full cursor-default select-none items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                    onClick={() => setSelection(category)}
                  >
                    <span className="truncate">{category.tag}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {category.icons.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t px-3 py-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {searchEntries.length.toLocaleString()} icons
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-muted-foreground"
              onClick={() => selectIcon(null)}
            >
              Clear icon
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
