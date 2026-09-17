"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";
import { useEffect, useRef, useState, type RefObject } from "react";
import Moveable from "react-moveable";
import { cn, useSettingsStore } from "@repo/lib";
import { Move, Settings, Maximize2, Minimize2 } from "lucide-react";
import { useMap } from "../(interactive-map)/store";
import { Toggle } from "../ui/toggle";
import { Button } from "../(controls)";
import { useT } from "../(providers)";

/**
 * The overlay minimap's setup toolbar: a fixed pill of icon buttons that never
 * changes size, so the button under the cursor stays put when the settings
 * open. The settings live in a card BELOW the pill (`MinimapSettingsCard`)
 * instead of being injected into the same row — the old inline select + slider
 * pushed the gear off the window edge on a 300px minimap.
 */
function MinimapToolbar({
  className,
  moveRef,
  fullscreen,
  onToggleFullscreen,
  isEditMode,
  onEditModeChange,
}: {
  className?: string;
  /** Drag handle for react-moveable; omitted in fullscreen (nothing to move). */
  moveRef?: RefObject<HTMLButtonElement | null>;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  isEditMode: boolean;
  onEditModeChange: (editMode: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "absolute z-10 left-1/2 -translate-x-1/2 flex overflow-hidden rounded-lg bg-card shadow-md",
        className,
      )}
    >
      {moveRef && (
        <Button
          ref={moveRef}
          className="cursor-move rounded-none"
          size="icon"
          variant="secondary"
          aria-label="Move minimap"
          title="Drag to move"
        >
          <Move className="w-4 h-4" />
        </Button>
      )}
      <Button
        className="rounded-none"
        size="icon"
        variant="secondary"
        onClick={onToggleFullscreen}
        aria-label={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {fullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </Button>
      <Toggle
        className="rounded-none"
        aria-label="Toggle Map Settings"
        title="Minimap settings"
        pressed={isEditMode}
        onPressedChange={onEditModeChange}
      >
        <Settings className="w-4 h-4" />
      </Toggle>
    </div>
  );
}

/** Card under the toolbar with the minimap's own settings (edit mode). */
function MinimapSettingsCard({
  className,
  fullscreen,
}: {
  className?: string;
  fullscreen: boolean;
}) {
  const t = useT();
  const mapFilter = useSettingsStore((state) => state.mapFilter);
  const setMapFilter = useSettingsStore((state) => state.setMapFilter);
  const windowOpacity = useSettingsStore((state) => state.windowOpacity);
  const setWindowOpacity = useSettingsStore((state) => state.setWindowOpacity);
  // `?? 0`: profiles persisted before the setting existed lack the key.
  const mapDarkness = useSettingsStore((state) => state.mapDarkness ?? 0);
  const setMapDarkness = useSettingsStore((state) => state.setMapDarkness);
  const followPlayer = useSettingsStore((state) => state.followPlayer);
  const toggleFollowPlayer = useSettingsStore(
    (state) => state.toggleFollowPlayer,
  );
  // The minimap is the in-game overlay: its own rotate value, separate from
  // the desktop / website one.
  const rotateMapWithPlayer = useSettingsStore(
    (state) => state.rotateMapWithPlayerOverlay,
  );
  const setRotateMapWithPlayer = useSettingsStore(
    (state) => state.setRotateMapWithPlayer,
  );

  return (
    <div
      className={cn(
        "absolute z-10 left-1/2 -translate-x-1/2 w-64 max-w-[calc(100%-1rem)]",
        "rounded-lg border border-input bg-card/95 backdrop-blur-sm shadow-md p-3",
        "flex flex-col gap-3 text-xs",
        className,
      )}
      // The container is the react-moveable target: keep wheel/pointer
      // interactions on the card from reaching the map underneath.
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <label className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">
          {t("minimap.transparency", { fallback: "Transparency" })}
        </span>
        <Select value={mapFilter} onValueChange={setMapFilter}>
          <SelectTrigger className="h-7 w-36 text-xs focus:ring-0">
            <SelectValue placeholder="Transparency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Transparency</SelectItem>
            <SelectItem value="greyscale">Greyscale</SelectItem>
            <SelectItem value="colorful">Colorful</SelectItem>
            <SelectItem value="full">Full Transparency</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground shrink-0">
          {t("minimap.opacity", { fallback: "Opacity" })}
        </span>
        <span className="flex items-center gap-2 w-36">
          <Slider
            className="flex-1"
            value={[windowOpacity]}
            step={0.05}
            min={0.25}
            max={1}
            onValueChange={(value) => setWindowOpacity(value[0])}
            aria-label="Opacity"
          />
          <span className="tabular-nums w-8 text-right text-muted-foreground">
            {Math.round(windowOpacity * 100)}%
          </span>
        </span>
      </label>
      <label className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground shrink-0">
          {t("settings.darkMap", { fallback: "Dark Map" })}
        </span>
        <span className="flex items-center gap-2 w-36">
          <Slider
            className="flex-1"
            value={[mapDarkness]}
            step={0.05}
            min={0}
            max={1}
            onValueChange={(value) => setMapDarkness(value[0])}
            aria-label="Dark map"
          />
          <span className="tabular-nums w-8 text-right text-muted-foreground">
            {Math.round(mapDarkness * 100)}%
          </span>
        </span>
      </label>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-muted-foreground">
          {t("settings.followPlayer", { fallback: "Follow Player" })}
        </span>
        <Switch
          checked={followPlayer}
          onCheckedChange={toggleFollowPlayer}
          aria-label="Follow player"
        />
      </label>
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-muted-foreground">
          {t("settings.rotateMapWithPlayer", {
            fallback: "Rotate Map With Player",
          })}
        </span>
        <Switch
          checked={rotateMapWithPlayer && followPlayer}
          onCheckedChange={(checked) =>
            setRotateMapWithPlayer(checked, "overlay")
          }
          aria-label="Rotate map with player"
        />
      </label>
      {!fullscreen && (
        <p className="text-[11px] leading-snug text-muted-foreground/80">
          {t("minimap.resizeHint", {
            fallback:
              "Drag the corner handles to resize and the round handle to round the corners.",
          })}
        </p>
      )}
    </div>
  );
}

export function MapContainer({
  children,
  isOverlay,
}: {
  children?: React.ReactNode;
  isOverlay: boolean;
}) {
  const targetRef = useRef<HTMLButtonElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useMap();
  const {
    _hasHydrated,
    lockedWindow,
    mapTransform,
    setMapTransform,
    windowOpacity,
    overlayFullscreen,
    toggleOverlayFullscreen,
  } = useSettingsStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const moveableRef = useRef<Moveable>(null);

  useEffect(() => {
    if (!isOverlay || !_hasHydrated) {
      return;
    }
    const timeoutId = setTimeout(() => {
      moveableRef.current?.moveable.request(
        "draggable",
        { deltaX: 0, deltaY: 0 },
        true,
      );
    }, 1000);

    const onResize = () => {
      // @ts-ignore
      moveableRef.current?.moveable.request(
        "draggable",
        { deltaX: 0, deltaY: 0 },
        true,
      );
    };
    window.addEventListener("resize", onResize, true);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize, true);
    };
  }, [_hasHydrated]);

  useEffect(() => {
    if (!isOverlay || !_hasHydrated) {
      return;
    }

    if (mapTransform !== null) {
      return;
    }
    console.log(
      `Setting map transform with ${window.innerWidth} and ${window.innerHeight}`,
    );
    setMapTransform({
      borderRadius: "0px",
      transform: `translate(${
        (typeof window !== "undefined" ? window.innerWidth : 1600) - 300
      }px, ${(typeof window !== "undefined" ? window.innerHeight : 1600) - 600}px)`,
      width: "300px",
      height: "300px",
    });
  }, [mapTransform, _hasHydrated]);

  // Invalidate map size when toggling fullscreen to force a resize
  useEffect(() => {
    if (!isOverlay || !_hasHydrated) return;
    map?.invalidateSize();
  }, [overlayFullscreen]);

  // Locking the window ends the setup session.
  useEffect(() => {
    if (lockedWindow) setIsEditMode(false);
  }, [lockedWindow]);

  // Fade the locked map while the cursor is over it, so the game behind stays
  // visible. The locked container is fully click-through (lock-block-input),
  // so its own mouse events never fire — listen at document level and
  // hit-test the container bounds instead.
  useEffect(() => {
    if (!isOverlay || !lockedWindow) return;
    let timeout: NodeJS.Timeout | null = null;
    const onMouseMove = (event: MouseEvent) => {
      const el = mapContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) return;
      if (timeout) clearTimeout(timeout);
      el.classList.add("lock-opacity");
      timeout = setTimeout(() => {
        mapContainerRef.current?.classList.remove("lock-opacity");
      }, 1000);
    };
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      if (timeout) clearTimeout(timeout);
      mapContainerRef.current?.classList.remove("lock-opacity");
    };
  }, [isOverlay, lockedWindow]);

  if (!isOverlay) {
    return children;
  }

  if (!_hasHydrated) {
    return <></>;
  }

  // Fullscreen overlay mode: occupy entire window with simple wrapper and exit control
  if (overlayFullscreen) {
    return (
      <>
        <div
          ref={mapContainerRef}
          className={cn("absolute inset-0 will-change-transform z-10", {
            "lock-block-input": lockedWindow,
          })}
        >
          {!lockedWindow && (
            <>
              {/* Centered on the map-actions row (fixed top-[40px], z-500
                  like the right-hand action bar). It must NOT sit in the
                  left column: the expanded Filters panel (fixed, z-500,
                  up to 363px wide) covers anything below it there, which
                  hid the exit-fullscreen button. */}
              <MinimapToolbar
                className="fixed top-[40px] mt-px z-500"
                fullscreen
                onToggleFullscreen={toggleOverlayFullscreen}
                isEditMode={isEditMode}
                onEditModeChange={setIsEditMode}
              />
              {isEditMode && (
                <MinimapSettingsCard
                  className="fixed top-21 z-500"
                  fullscreen
                />
              )}
            </>
          )}
          <div
            className={cn("h-full w-full overflow-hidden")}
            style={{ willChange: "opacity", opacity: windowOpacity }}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
  const { borderRadius, ...mapTransformWithoutBorderRadius } =
    mapTransform || {};
  return (
    <>
      <div
        ref={mapContainerRef}
        className={cn(`lock absolute inset-0 will-change-transform z-11000`, {
          "lock-block-input": lockedWindow,
        })}
        style={mapTransformWithoutBorderRadius}
      >
        {!lockedWindow && (
          <>
            <MinimapToolbar
              className="top-2"
              moveRef={targetRef}
              fullscreen={false}
              onToggleFullscreen={toggleOverlayFullscreen}
              isEditMode={isEditMode}
              onEditModeChange={setIsEditMode}
            />
            {isEditMode && (
              <MinimapSettingsCard className="top-13" fullscreen={false} />
            )}
          </>
        )}
        <div
          ref={mapRef}
          className={cn("h-full w-full overflow-hidden")}
          style={{
            willChange: "opacity",
            opacity: windowOpacity,
            borderRadius: borderRadius,
          }}
        >
          {children}
        </div>
      </div>
      {!lockedWindow && (
        <Moveable
          ref={moveableRef}
          target={mapContainerRef}
          dragTarget={targetRef}
          draggable
          throttleDrag={1}
          resizable={isEditMode}
          hideDefaultLines
          bounds={{ left: 0, top: 24, right: 0, bottom: 0, position: "css" }}
          snappable
          origin={false}
          roundPadding={15}
          roundable={isEditMode}
          isDisplayShadowRoundControls="horizontal"
          onDragStart={() => {
            mapRef.current!.classList.add("pointer-events-none");
          }}
          className="z-12000!"
          onDragEnd={() => {
            mapRef.current!.classList.remove("pointer-events-none");
          }}
          onRound={(e) => {
            mapRef.current!.style.borderRadius = e.borderRadius;
          }}
          onRender={(e) => {
            e.target.style.cssText += e.cssText;
          }}
          onRenderEnd={(e) => {
            setMapTransform({
              borderRadius: mapRef.current!.style.borderRadius,
              transform: e.target.style.transform,
              width: e.target.style.width,
              height: e.target.style.height,
            });
            map?.invalidateSize();
          }}
        />
      )}
    </>
  );
}
