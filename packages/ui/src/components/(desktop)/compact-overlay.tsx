"use client";
import {
  cn,
  findPlayerRegion,
  gridCellAt,
  useGameState,
  usePreviewFeature,
  useSettingsStore,
  COMPACT_OVERLAY_FEATURE,
  type CompactOverlayWidget,
} from "@repo/lib";
import { Map as MapIcon, Move } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import Moveable from "react-moveable";
import { Button, PreviewBadge } from "../(controls)";
import { useCoordinates, useT } from "../(providers)";
import { PaliaClock } from "../(data)/palia-clock";
import { PALIA_GRID_BOUNDS } from "../(data)/palia-grid";
import { usePaliaTime } from "../(data)/palia-time";
import { PaliaWeeklyWants } from "../(data)/palia-weekly-wants";

/**
 * The overlay's "Widgets Only" mode: replaces the minimap with a small
 * movable panel of the game's `compactOverlay` widgets (games.ts). Shown only
 * in the in-game overlay window, see useCompactOverlay(). Like the minimap,
 * the panel is click-through while the window is locked ("Hide Controls").
 */
export function CompactOverlay({
  widgets,
  onShowMap,
}: {
  widgets: CompactOverlayWidget[];
  onShowMap: () => void;
}) {
  const t = useT();
  const isPreview = usePreviewFeature(COMPACT_OVERLAY_FEATURE).preview;
  const panelRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const moveableRef = useRef<Moveable>(null);
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  const windowOpacity = useSettingsStore((state) => state.windowOpacity);
  const hasHydrated = useSettingsStore((state) => state._hasHydrated);
  const savedTransform = useSettingsStore(
    (state) => state.compactOverlayTransform,
  );
  const mapTransform = useSettingsStore((state) => state.mapTransform);
  const setCompactOverlayTransform = useSettingsStore(
    (state) => state.setCompactOverlayTransform,
  );
  // First use: open where the minimap sits, so the panel takes its place.
  const transform =
    savedTransform ?? mapTransform?.transform ?? "translate(8px, 48px)";

  // Keep the panel inside the window after a resize (same as the minimap).
  useEffect(() => {
    if (lockedWindow) return;
    const reclamp = () =>
      moveableRef.current?.moveable.request(
        "draggable",
        { deltaX: 0, deltaY: 0 },
        true,
      );
    const timeoutId = setTimeout(reclamp, 500);
    window.addEventListener("resize", reclamp, true);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", reclamp, true);
    };
  }, [lockedWindow]);

  if (!hasHydrated) return null;

  return (
    <>
      <div
        ref={panelRef}
        data-testid="compact-overlay"
        className={cn(
          "lock absolute left-0 top-0 z-11000 w-64 will-change-transform",
          { "lock-block-input": lockedWindow },
        )}
        style={{ transform }}
      >
        <div
          className="rounded-lg border border-input bg-card/90 shadow-md text-sm overflow-hidden"
          style={{ opacity: windowOpacity }}
        >
          {!lockedWindow && (
            <div className="flex items-center gap-1 border-b border-input bg-card px-1 py-0.5">
              <Button
                ref={handleRef}
                className="h-7 w-7 cursor-move"
                size="icon"
                variant="ghost"
                aria-label="Move widgets"
                title="Drag to move"
              >
                <Move className="h-4 w-4" />
              </Button>
              <span className="grow truncate text-xs text-muted-foreground">
                {t("compactOverlay.title", { fallback: "Widgets Only" })}
                {isPreview && <PreviewBadge />}
              </span>
              <Button
                className="h-7 px-2 text-xs"
                size="sm"
                variant="ghost"
                onClick={onShowMap}
                onMouseDown={(e) => e.stopPropagation()}
                title="Show the map again"
              >
                <MapIcon className="mr-1 h-3.5 w-3.5" />
                {t("compactOverlay.showMap", { fallback: "Show Map" })}
              </Button>
            </div>
          )}
          <div className="flex flex-col py-1">
            {widgets.map((widget) => {
              const Widget = COMPACT_WIDGETS[widget];
              return <Widget key={widget} locked={lockedWindow} />;
            })}
          </div>
        </div>
      </div>
      {!lockedWindow && (
        <Moveable
          ref={moveableRef}
          target={panelRef}
          dragTarget={handleRef}
          draggable
          throttleDrag={1}
          hideDefaultLines
          bounds={{ left: 0, top: 24, right: 0, bottom: 0, position: "css" }}
          snappable
          origin={false}
          className="z-12000!"
          onRender={(e) => {
            e.target.style.transform = e.transform;
          }}
          onRenderEnd={(e) => {
            setCompactOverlayTransform(e.target.style.transform);
          }}
        />
      )}
    </>
  );
}

type WidgetProps = { locked: boolean };

const COMPACT_WIDGETS: Record<
  CompactOverlayWidget,
  (props: WidgetProps) => ReactNode
> = {
  CurrentZone,
  PaliaGridCell,
  PaliaTime: PaliaTimeWidget,
  PaliaWeeklyWants: PaliaWeeklyWantsWidget,
};

function WidgetRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="truncate text-right font-medium">{children}</span>
    </div>
  );
}

/** Generic: the player's map and the area (region) inside it. */
function CurrentZone() {
  const t = useT();
  const { regions } = useCoordinates();
  const player = useGameState((state) => state.player);
  const mapName = player?.mapName;
  if (!player || !mapName) {
    return (
      <WidgetRow label={t("compactOverlay.zone", { fallback: "Zone" })}>
        –
      </WidgetRow>
    );
  }
  const found = findPlayerRegion(regions, mapName, [player.x, player.y]);
  const mapTitle = t(mapName, { fallback: mapName });
  let area: string | null = null;
  if (found) {
    const regionTitle = t(found.region.id, { fallback: "" });
    if (regionTitle) {
      area = found.inside
        ? regionTitle
        : `${t("compactOverlay.near", { fallback: "near" })} ${regionTitle}`;
    }
  }
  return (
    <>
      <WidgetRow label={t("compactOverlay.zone", { fallback: "Zone" })}>
        {mapTitle}
      </WidgetRow>
      {area && (
        <div className="-mt-1 truncate px-3 pb-1 text-right text-xs text-muted-foreground">
          {area}
        </div>
      )}
    </>
  );
}

/** Palia: the grid square the player stands in (same labels as the map grid). */
function PaliaGridCell() {
  const t = useT();
  const player = useGameState((state) => state.player);
  const config = player?.mapName ? PALIA_GRID_BOUNDS[player.mapName] : null;
  const cell =
    player && config
      ? gridCellAt(config.bounds, config.divisions ?? 10, [player.x, player.y])
      : null;
  return (
    <WidgetRow label={t("compactOverlay.grid", { fallback: "Grid" })}>
      {cell ?? "–"}
    </WidgetRow>
  );
}

function PaliaTimeWidget({ locked }: WidgetProps) {
  const time = usePaliaTime();
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-1">
      <span className="text-muted-foreground">Palia Time</span>
      <PaliaClock disabled={locked} className="mx-0 font-medium">
        {time}
      </PaliaClock>
    </div>
  );
}

function PaliaWeeklyWantsWidget() {
  return (
    <div className="px-1">
      <PaliaWeeklyWants />
    </div>
  );
}
