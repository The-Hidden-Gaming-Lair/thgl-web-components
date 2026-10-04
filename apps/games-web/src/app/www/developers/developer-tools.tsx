"use client";
import { useEffect, useMemo, useState } from "react";
import {
  buildEmbedSnippet,
  buildEmbedUrl,
  games,
  getAppDomain,
} from "@repo/lib";

/** A copyable code block. */
export function CopyBox({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre
        aria-label={label}
        className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-neutral-950 p-3 pr-20 text-left text-xs text-neutral-200"
      >
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 rounded-md border border-border bg-neutral-900 px-2 py-1 text-xs hover:bg-neutral-800"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

const KEPT_PARAMS = ["center", "zoom", "types", "hide", "share"];

/**
 * Turn any th.gl map link (copied from the address bar or a "Share Map View"
 * URL) into embed code.
 */
function linkToEmbed(input: string): { snippet: string; url: string } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const sub = url.hostname.split(".")[0];
  if (!/\.th\.gl$/.test(url.hostname) || ["www", "app"].includes(sub)) {
    return null;
  }
  const segs = url.pathname.split("/").filter(Boolean);
  let locale: string | undefined;
  if (segs[0] !== "maps" && segs[1] === "maps") locale = segs.shift();
  if (segs[0] !== "maps" || !segs[1]) return null;
  let mapTitle: string;
  try {
    mapTitle = decodeURIComponent(segs[1]);
  } catch {
    return null;
  }
  const game = games.find((g) => getAppDomain(g) === sub);
  const center = url.searchParams
    .get("center")
    ?.split(",")
    .map((v) => parseFloat(v));
  const zoom = parseFloat(url.searchParams.get("zoom") ?? "");
  const list = (key: string) =>
    url.searchParams.get(key)?.split(",").filter(Boolean);
  const options = {
    domain: sub,
    mapTitle,
    locale,
    center:
      center?.length === 2 && center.every(Number.isFinite)
        ? ([center[0], center[1]] as [number, number])
        : undefined,
    zoom: Number.isFinite(zoom) ? zoom : undefined,
    types: list("types"),
    hide: list("hide"),
    share: url.searchParams.get("share") ?? undefined,
  };
  return {
    url: buildEmbedUrl(options),
    snippet: buildEmbedSnippet({
      ...options,
      gameTitle: game?.title ?? sub,
      mapDisplayName: mapTitle,
    }),
  };
}

export function EmbedFromLink({ example }: { example: string }) {
  const [input, setInput] = useState(example);
  const result = useMemo(() => linkToEmbed(input), [input]);
  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Map link</span>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="https://palia.th.gl/maps/Kilima%20Village"
          className="h-9 w-full rounded-md border border-border bg-neutral-950 px-3 text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />
      </label>
      {result ? (
        <CopyBox code={result.snippet} label="Embed code" />
      ) : (
        <p className="text-sm text-red-400">
          Paste a map link like https://palia.th.gl/maps/Kilima%20Village
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Parameters other than {KEPT_PARAMS.join(", ")} are dropped.
      </p>
    </div>
  );
}

/** Loads the tooltip script once so the demo links on this page get tooltips. */
export function TooltipsDemoLoader({ src }: { src: string }) {
  useEffect(() => {
    const w = window as unknown as {
      thglTooltipsConfig?: Record<string, unknown>;
      thglTooltips?: { refresh: () => void };
    };
    w.thglTooltipsConfig = { iconizeLinks: true, colorLinks: true };
    if (w.thglTooltips) {
      w.thglTooltips.refresh();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    document.body.appendChild(script);
  }, [src]);
  return null;
}
