import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  buildEmbedSnippet,
  buildEmbedUrl,
  DEVELOPERS_URL,
  games,
  getAppDomain,
  getCurrentGameId,
  translate,
} from "@repo/lib";
import { useCoordinates, useI18n, useT, useUserStore } from "../(providers)";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { useMap } from "./store";

const HEIGHTS = [400, 480, 600];

/** Tenant subdomain + title of the game this map belongs to (web, app, dev). */
function getEmbedGame(): { domain: string; title: string } {
  const id = getCurrentGameId();
  const sub = window.location.hostname.split(".")[0].replace(/-dev$/, "");
  const game =
    games.find((g) => g.id === id) ??
    games.find((g) => g.id === sub || getAppDomain(g) === sub);
  return game
    ? { domain: getAppDomain(game), title: game.title }
    : { domain: sub, title: sub };
}

/**
 * "Embed this map": copy-paste HTML (iframe + attribution link) for the
 * current map, optionally with the current view, the enabled markers and a
 * shared custom filter. See @repo/lib embed.ts.
 */
export function EmbedMapDialog({
  open,
  onClose,
  center,
  share,
}: {
  open: boolean;
  onClose: () => void;
  /** Clicked position (context menu); defaults to the map center. */
  center?: [number, number];
  /** A shared custom filter to include. */
  share?: { code: string; name: string };
}) {
  const t = useT();
  const map = useMap();
  const { dict, locale } = useI18n();
  const { filters: allFilters } = useCoordinates();
  const mapName = useUserStore((state) => state.mapName);
  const filters = useUserStore((state) => state.filters);
  const [withView, setWithView] = useState(true);
  const [withFilters, setWithFilters] = useState(!share);
  const [height, setHeight] = useState(480);

  const embed = useMemo(() => {
    if (!open || typeof window === "undefined") return null;
    const game = getEmbedGame();
    const values = allFilters.flatMap((group) =>
      group.values.map((value) => ({
        id: value.id,
        defaultOn: value.defaultOn ?? group.defaultOn ?? false,
      })),
    );
    const enabled = new Set(filters);
    const shown = values.filter((v) => enabled.has(v.id)).map((v) => v.id);
    const isDefault = values.every((v) => v.defaultOn === enabled.has(v.id));
    // Shortest stable encoding of the enabled marker types: nothing for the
    // defaults, else the shown list or the hidden list, whichever is shorter.
    let types: string[] | undefined;
    let hide: string[] | undefined;
    if (share && !withFilters) {
      types = ["none"]; // only the shared filter
    } else if (withFilters && !isDefault) {
      const hidden = values.filter((v) => !enabled.has(v.id)).map((v) => v.id);
      if (shown.join(",").length <= hidden.join(",").length) types = shown;
      else hide = hidden;
    }
    const options = {
      domain: game.domain,
      mapTitle: translate(dict, mapName),
      locale,
      center: withView
        ? (center ??
          (map ? [map.getCenter().lat, map.getCenter().lng] : undefined))
        : undefined,
      zoom: withView && map ? map.getZoom() : undefined,
      types,
      hide,
      share: share?.code,
    } satisfies Parameters<typeof buildEmbedUrl>[0];
    return {
      url: buildEmbedUrl(options),
      snippet: buildEmbedSnippet({
        ...options,
        gameTitle: game.title,
        mapDisplayName: translate(dict, mapName),
        height,
      }),
    };
  }, [
    open,
    allFilters,
    dict,
    mapName,
    locale,
    withView,
    center,
    map,
    withFilters,
    filters,
    share,
    height,
  ]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {t("embed.title", { fallback: "Embed this map" })}
          </DialogTitle>
          <DialogDescription>
            {t("embed.description", {
              fallback:
                "Put this interactive map on your website, blog or guide. Free, no sign-up. Keep the link below the map.",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {share && (
            <p className="text-sm">
              {t("embed.sharedFilter", {
                fallback: "Includes your custom filter: {{name}}",
                vars: { name: share.name },
              })}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Label htmlFor="embedWithView">
              {t("embed.withView", { fallback: "Start at the current view" })}
            </Label>
            <Switch
              id="embedWithView"
              checked={withView}
              onCheckedChange={setWithView}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="embedWithFilters">
              {t("embed.withFilters", {
                fallback: "Only the markers I have enabled",
              })}
            </Label>
            <Switch
              id="embedWithFilters"
              checked={withFilters}
              onCheckedChange={setWithFilters}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t("embed.height", { fallback: "Height" })}
            </span>
            <div className="flex overflow-hidden rounded-md border border-input text-xs">
              {HEIGHTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHeight(h)}
                  className={
                    h === height
                      ? "bg-primary px-2 py-1 text-primary-foreground"
                      : "px-2 py-1 hover:bg-muted"
                  }
                >
                  {h}px
                </button>
              ))}
            </div>
          </div>
          <Textarea
            readOnly
            value={embed?.snippet ?? ""}
            className="h-32 font-mono text-xs"
            onFocus={(event) => event.currentTarget.select()}
            aria-label={t("embed.code", { fallback: "Embed code" })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                if (!embed) return;
                navigator.clipboard.writeText(embed.snippet);
                toast(
                  t("common.copiedToClipboard", {
                    fallback: "Copied to clipboard",
                  }),
                );
              }}
            >
              {t("embed.copy", { fallback: "Copy embed code" })}
            </Button>
            {embed && (
              <Button variant="outline" asChild>
                <a href={embed.url} target="_blank" rel="noopener">
                  {t("embed.preview", { fallback: "Preview" })}
                </a>
              </Button>
            )}
            <a
              href={DEVELOPERS_URL}
              target="_blank"
              rel="noopener"
              className="ml-auto text-xs text-muted-foreground hover:text-primary"
            >
              {t("embed.learnMore", { fallback: "Embeds & tooltips" })}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
