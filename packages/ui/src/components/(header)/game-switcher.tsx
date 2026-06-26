"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn, isOverwolf } from "@repo/lib";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import apps from "./global-menu.json";

// On games-web (and the THGL desktop app served from app.th.gl) the public
// folder is shared across every tenant, so a relative path resolves on
// palia.localhost:3100, palia.th.gl, www.th.gl, etc. Overwolf apps run on
// the `overwolf-extension://` scheme where that path doesn't exist, so they
// have to hit the absolute production URL. The legacy
// `https://www.th.gl/global_icons/` URL was being rewritten to
// `/www/global_icons/*` (no route → Bunny deploy-placeholder HTML → Chrome
// ORB blocked it cross-origin), so we point at the actually-served
// `/games/thgl-web/global_icons/` path in both cases.
const ICON_BASE_URL = isOverwolf
  ? "https://www.th.gl/games/thgl-web/global_icons/"
  : "/games/thgl-web/global_icons/";

type AppEntry = (typeof apps)[number];

type Sprite = {
  fileName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sheetWidth?: number;
  sheetHeight?: number;
};

// Legacy fallback only (partner sprites now carry sheetWidth/sheetHeight): the
// partner sheet's coord-derived bounds, used if an icon predates those fields.
const partnerSprites = apps.flatMap((a) =>
  ("partners" in a ? (a.partners ?? []) : []).map((p) => p.sprite),
);
const PARTNER_SHEET_FALLBACK_W = Math.max(
  0,
  ...partnerSprites.map((s) => s.x + s.width),
);
const PARTNER_SHEET_FALLBACK_H = Math.max(
  0,
  ...partnerSprites.map((s) => s.y + s.height),
);

// Renders one icon out of a packed sprite sheet, scaled to `size`. Cells are
// packed at their native size (a MAX cap, not a fixed cell), so the sheet MUST
// be scaled by the icon's own width — cropping a fixed-size box would clip any
// source that isn't exactly `size` px. Uses the real sheet canvas size emitted
// by createImageSprite; the shelf packer leaves trailing slack so a
// coord-derived bound (the legacy fallback) under-reports it and CSS would
// squish the sheet, misaligning every icon.
function SpriteIcon({
  sprite,
  label,
  size,
  sheetFallbackWidth,
  sheetFallbackHeight,
  className,
}: {
  sprite: Sprite;
  label: string;
  size: number;
  sheetFallbackWidth: number;
  sheetFallbackHeight: number;
  className?: string;
}) {
  const scale = size / sprite.width;
  const sheetWidth = sprite.sheetWidth ?? sheetFallbackWidth;
  const sheetHeight = sprite.sheetHeight ?? sheetFallbackHeight;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("bg-background shrink-0 rounded-full", className)}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${ICON_BASE_URL}${sprite.fileName})`,
        backgroundPosition: `-${sprite.x * scale}px -${sprite.y * scale}px`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        backgroundRepeat: "no-repeat",
        backgroundOrigin: "border-box",
      }}
    />
  );
}

function GameIcon({
  app,
  size = 36,
  className,
}: {
  app: AppEntry;
  size?: number;
  className?: string;
}) {
  return (
    <SpriteIcon
      sprite={app.sprite}
      label={app.title}
      size={size}
      sheetFallbackWidth={Math.max(
        ...apps.map((a) => a.sprite.x + a.sprite.width),
      )}
      sheetFallbackHeight={Math.max(
        ...apps.map((a) => a.sprite.y + a.sprite.height),
      )}
      className={className}
    />
  );
}

export function GameSwitcher({
  activeApp,
  compact,
}: {
  activeApp: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const { activeAppData, otherApps } = useMemo(() => {
    let active: AppEntry | undefined;
    const rest: AppEntry[] = [];
    for (const app of apps) {
      if (app.title === activeApp) {
        active = app;
      } else {
        rest.push(app);
      }
    }
    rest.sort((a, b) => a.title.localeCompare(b.title));
    return { activeAppData: active, otherApps: rest };
  }, [activeApp]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5",
            "hover:bg-white/10 transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          )}
          aria-label="Switch game"
        >
          {activeAppData ? (
            <GameIcon
              app={activeAppData}
              size={compact ? 22 : 32}
              className={
                compact ? "border border-primary" : "border-2 border-primary"
              }
            />
          ) : (
            <div
              className={
                compact
                  ? "w-[22px] h-[22px] rounded-full bg-muted"
                  : "w-8 h-8 rounded-full bg-muted"
              }
            />
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-[340px] p-0 border-border/60 bg-background/95 backdrop-blur-xl"
      >
        <ScrollArea className="h-[min(420px,70vh)]" type="always">
          {/* Active game + partners section */}
          {activeAppData && (
            <div className="border-b border-border/40 p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <GameIcon
                  app={activeAppData}
                  size={28}
                  className="border-2 border-primary"
                />
                <span className="text-sm font-semibold text-primary">
                  {activeAppData.title}
                </span>
              </div>
              {activeAppData.partners && activeAppData.partners.length > 0 && (
                <div className="flex flex-wrap gap-1.5 ml-0.5">
                  {activeAppData.partners.map((partner) => (
                    <a
                      key={partner.url}
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-muted/40 hover:bg-muted transition-colors"
                    >
                      {partner.sprite && (
                        <SpriteIcon
                          sprite={partner.sprite}
                          label={partner.title}
                          size={14}
                          sheetFallbackWidth={PARTNER_SHEET_FALLBACK_W}
                          sheetFallbackHeight={PARTNER_SHEET_FALLBACK_H}
                        />
                      )}
                      {partner.title}
                      <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Game grid */}
          <div className="grid grid-cols-4 gap-1 p-2">
            {otherApps.map((app) => (
              <a
                key={app.url}
                href={app.url}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex flex-col items-center gap-1 rounded-lg p-2",
                  "transition-colors hover:bg-white/8",
                )}
                title={app.title}
              >
                <GameIcon
                  app={app}
                  size={36}
                  className="border-2 border-transparent group-hover:border-white/30 transition-colors"
                />
                <span className="text-[10px] leading-tight text-center line-clamp-2 w-full text-muted-foreground group-hover:text-foreground">
                  {app.title}
                </span>
              </a>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
