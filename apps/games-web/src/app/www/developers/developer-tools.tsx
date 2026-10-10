"use client";
import { useEffect, useMemo, useState } from "react";
import {
  buildEmbedSnippet,
  buildEmbedUrl,
  buildFullMapUrl,
  games,
  getAppDomain,
} from "@repo/lib";

/**
 * A creator's channel/site name as a `?ref=` tag: lowercase, `a-z 0-9 . _ -`
 * only, at most 40 characters. Plausible lists it as the visit source (embed
 * and map pages keep `ref` in the URL of their first pageview).
 */
function normalizeRefTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

function withRef(url: string, ref: string | undefined): string {
  if (!ref) return url;
  return `${url}${url.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`;
}

const escapeAmp = (value: string) => value.replace(/&/g, "&amp;");

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
function linkToEmbed(
  input: string,
  ref?: string,
): {
  snippet: string;
  url: string;
  fullMapUrl: string;
  homeUrl: string;
  gameTitle: string;
} | null {
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
  const gameTitle = game?.title ?? sub;
  const embedUrl = buildEmbedUrl(options);
  const fullMapUrl = buildFullMapUrl(options);
  // Tag both the iframe src and the attribution link with the ref.
  const snippet = buildEmbedSnippet({
    ...options,
    gameTitle,
    mapDisplayName: mapTitle,
  })
    .replace(
      `src="${escapeAmp(embedUrl)}"`,
      `src="${escapeAmp(withRef(embedUrl, ref))}"`,
    )
    .replace(
      `href="${escapeAmp(fullMapUrl)}"`,
      `href="${escapeAmp(withRef(fullMapUrl, ref))}"`,
    );
  // Description links keep the creator's own view (zoom, filters, share code).
  if (url.searchParams.has("ref")) url.searchParams.delete("ref");
  url.hash = "";
  return {
    url: withRef(embedUrl, ref),
    snippet,
    fullMapUrl: withRef(url.toString().replace(/%2C/g, ","), ref),
    homeUrl: withRef(`https://${sub}.th.gl/`, ref),
    gameTitle,
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

const PLATFORMS = [
  { prefix: "yt", label: "YouTube" },
  { prefix: "twitch", label: "Twitch" },
  { prefix: "", label: "Website / other" },
];

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-border bg-neutral-950 px-3 text-sm outline-none focus:ring-1 focus:ring-amber-500";

/**
 * Creator kit: one map link + the creator's channel name in, ref-tagged copy
 * blocks out (video/stream description, chat command, website embed, OBS
 * browser source). The `?ref=` tag is what Plausible lists as the source.
 */
export function CreatorKit({ example }: { example: string }) {
  const [input, setInput] = useState(example);
  const [prefix, setPrefix] = useState(PLATFORMS[0]!.prefix);
  const [channel, setChannel] = useState("");
  const name = normalizeRefTag(channel);
  const ref = name ? normalizeRefTag(prefix ? `${prefix}-${name}` : name) : "";
  const result = useMemo(() => linkToEmbed(input, ref), [input, ref]);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem_1fr]">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Map link</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://palia.th.gl/maps/Kilima%20Village"
            className={INPUT_CLASS}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Platform</span>
          <select
            value={prefix}
            onChange={(event) => setPrefix(event.target.value)}
            className={INPUT_CLASS}
          >
            {PLATFORMS.map((platform) => (
              <option key={platform.label} value={platform.prefix}>
                {platform.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Channel or site name</span>
          <input
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            placeholder="yourchannel"
            className={INPUT_CLASS}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        {ref ? (
          <>
            Your links carry <code className="text-amber-400">?ref={ref}</code>,
            so we can see how many viewers come from you.
          </>
        ) : (
          "Enter your channel name to tag the links with it."
        )}
      </p>
      {result ? (
        <>
          <h3 className="text-lg font-semibold">Video or stream description</h3>
          <CopyBox
            code={`${result.gameTitle} interactive map: ${result.fullMapUrl}\nAll ${result.gameTitle} maps and tools: ${result.homeUrl}`}
            label="Description links"
          />
          <h3 className="text-lg font-semibold">Chat command</h3>
          <p className="text-sm text-neutral-300">
            For Nightbot (StreamElements: <code>!cmd add map …</code>), so
            viewers get the link with <code>!map</code>.
          </p>
          <CopyBox
            code={`!commands add !map ${result.gameTitle} interactive map: ${result.fullMapUrl}`}
            label="Chat command"
          />
          <h3 className="text-lg font-semibold">Embed on your website</h3>
          <CopyBox code={result.snippet} label="Embed code" />
          <h3 className="text-lg font-semibold">OBS browser source</h3>
          <p className="text-sm text-neutral-300">
            Show the map on stream: in OBS add a <strong>Browser</strong> source
            with this URL, width 1920 and height 1080 for a full scene (or 640 ×
            480 for a corner). To pan or zoom while live, right-click the source
            → <strong>Interact</strong>.
          </p>
          <CopyBox code={result.url} label="OBS browser source URL" />
        </>
      ) : (
        <p className="text-sm text-red-400">
          Paste a map link like https://palia.th.gl/maps/Kilima%20Village
        </p>
      )}
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
