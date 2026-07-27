"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Home,
  Locate,
  MapPin,
  Minus,
  MoreHorizontal,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  cn,
  fromInGameCoords,
  useGameState,
  useSettingsStore,
} from "@repo/lib";
import type { WebMap } from "@repo/lib/web-map";
import { useMap } from "../(interactive-map)/store";
import { useCoordinatesOptional } from "../(providers)";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

/** Large interactive compass with draggable bearing ring and tilt slider */
function CompassPopover({
  bearing,
  pitch,
  onBearingChange,
  onPitchChange,
  onResetNorth,
}: {
  bearing: number;
  pitch: number;
  onBearingChange: (rad: number) => void;
  onPitchChange: (rad: number) => void;
  onResetNorth: () => void;
}) {
  const ringRef = useRef<SVGCircleElement>(null);
  const draggingRef = useRef(false);

  const getAngleFromEvent = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      const svg = ringRef.current?.closest("svg");
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // atan2 gives angle from positive X axis; we want angle from north (negative Y)
      return Math.atan2(e.clientX - cx, -(e.clientY - cy));
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      draggingRef.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
      const angle = getAngleFromEvent(e);
      if (angle !== null) onBearingChange(-angle);
    },
    [getAngleFromEvent, onBearingChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const angle = getAngleFromEvent(e);
      if (angle !== null) onBearingChange(-angle);
    },
    [getAngleFromEvent, onBearingChange],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const maxPitch = 1.4;
  const pitchPercent = (pitch / maxPitch) * 100;

  return (
    <div className="flex flex-col gap-3 items-center select-none">
      <div className="flex gap-3 items-center">
        {/* Draggable compass ring */}
        <div className="relative">
          <svg
            viewBox="0 0 120 120"
            className="w-28 h-28 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Outer ring */}
            <circle
              ref={ringRef}
              cx="60"
              cy="60"
              r="54"
              fill="none"
              className="stroke-border"
              strokeWidth="2"
            />
            {/* Tick marks and labels, rotated with bearing */}
            <g
              style={{
                transform: `rotate(${-bearing}rad)`,
                transformOrigin: "60px 60px",
                transformBox: "view-box",
              }}
            >
              {/* Cardinal ticks */}
              {[0, 90, 180, 270].map((deg) => (
                <line
                  key={deg}
                  x1="60"
                  y1="8"
                  x2="60"
                  y2="16"
                  className="stroke-muted-foreground"
                  strokeWidth="2"
                  transform={`rotate(${deg} 60 60)`}
                />
              ))}
              {/* Minor ticks */}
              {[45, 135, 225, 315].map((deg) => (
                <line
                  key={deg}
                  x1="60"
                  y1="10"
                  x2="60"
                  y2="15"
                  className="stroke-muted-foreground/50"
                  strokeWidth="1"
                  transform={`rotate(${deg} 60 60)`}
                />
              ))}
              {/* N label */}
              <text
                x="60"
                y="26"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                className="fill-red-400"
              >
                N
              </text>
              {/* S label */}
              <text
                x="60"
                y="100"
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                S
              </text>
              {/* E label */}
              <text
                x="99"
                y="64"
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                E
              </text>
              {/* W label */}
              <text
                x="21"
                y="64"
                textAnchor="middle"
                fontSize="9"
                className="fill-muted-foreground"
              >
                W
              </text>
              {/* North needle */}
              <polygon points="60,20 56,60 64,60" className="fill-red-500" />
              {/* South needle */}
              <polygon
                points="60,100 56,60 64,60"
                className="fill-zinc-400/60"
              />
            </g>
            {/* Center dot (stationary) */}
            <circle cx="60" cy="60" r="3" className="fill-zinc-300" />
          </svg>
        </div>

        {/* Tilt slider (vertical) */}
        <div className="flex flex-col items-center gap-1 h-28">
          <span className="text-[10px] text-muted-foreground">Tilt</span>
          <div className="flex-1 relative w-6 flex items-center justify-center">
            <input
              type="range"
              min="0"
              max="100"
              value={pitchPercent}
              onChange={(e) =>
                onPitchChange((Number(e.target.value) / 100) * maxPitch)
              }
              className="absolute h-20 w-20 -rotate-90 accent-primary cursor-pointer"
              style={{ appearance: "auto" }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {Math.round((pitch / Math.PI) * 180)}°
          </span>
        </div>
      </div>

      {/* Heading display + reset */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-muted-foreground tabular-nums flex-1 text-center">
          {Math.round(
            ((((-bearing % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) /
              Math.PI) *
              180,
          )}
          °
        </span>
        <button
          onClick={onResetNorth}
          className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="border-t border-border/40 pt-2 mt-1 space-y-0.5">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">
            Middle drag
          </kbd>
          <span>Tilt &amp; rotate</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">
            Ctrl + drag
          </kbd>
          <span>Tilt &amp; rotate</span>
        </div>
      </div>
    </div>
  );
}

/** Small compass needle for the button */
function CompassNeedle({ bearing }: { bearing: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="w-full h-full"
      style={{ transform: `rotate(${-bearing}rad)` }}
    >
      <polygon points="20,6 17,20 23,20" className="fill-red-500" />
      <polygon points="20,34 17,20 23,20" className="fill-zinc-400" />
      <circle cx="20" cy="20" r="2" className="fill-zinc-300" />
      <text
        x="20"
        y="5"
        textAnchor="middle"
        fontSize="5"
        fontWeight="bold"
        className="fill-red-400"
      >
        N
      </text>
    </svg>
  );
}

export function MapControls({
  hidden,
  webmap: externalMap,
  alwaysShowFollowPlayer,
  coordinateCopyFormat,
}: {
  hidden?: boolean;
  /** When provided, use this WebMap directly instead of the global useMap() store */
  webmap?: WebMap | null;
  /** Always show the follow player toggle (for in-game overlays) */
  alwaysShowFollowPlayer?: boolean;
  /** Per-game coordinate format (e.g. "({x},{y})"), used for the go-to placeholder */
  coordinateCopyFormat?: string;
}) {
  const storeMap = useMap();
  const map = externalMap ?? storeMap;
  const [bearing, setBearing] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [gotoInput, setGotoInput] = useState("");
  const [gotoError, setGotoError] = useState(false);
  const rafRef = useRef<number>(0);

  // Per-game map<->in-game transform (undefined for games without one). When
  // present, the go-to field offers an "in-game coordinates" toggle (persisted)
  // that converts the entered in-game coords to a map position before jumping.
  // Optional: MapControls also renders on the guide-page mini-map (SimpleWebMap)
  // where there is no CoordinatesProvider. Without a provider the in-game go-to
  // toggle simply doesn't appear.
  const inGameCoordinates = useCoordinatesOptional()?.inGameCoordinates;
  const [useInGameGoto, setUseInGameGoto] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("thgl:goto-ingame") === "1";
  });
  const toggleInGameGoto = useCallback((checked: boolean) => {
    setUseInGameGoto(checked);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("thgl:goto-ingame", checked ? "1" : "0");
    }
  }, []);

  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!map) return;
    let active = true;
    const update = () => {
      const m = mapRef.current;
      if (!active || !m) return;
      setBearing(m.getBearing());
      setPitch(m.getPitch());
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [map]);

  const handleBearingChange = useCallback(
    (rad: number) => map?.setBearing(rad),
    [map],
  );
  const handlePitchChange = useCallback(
    (rad: number) => map?.setPitch(rad),
    [map],
  );
  const handleResetNorth = useCallback(() => {
    if (!map) return;
    map.setBearing(0);
    map.setPitch(0);
  }, [map]);
  const handleToggle3D = useCallback(() => {
    if (!map) return;
    map.setPitch(map.getPitch() > 0.05 ? 0 : 0.7);
  }, [map]);
  const handleZoomIn = useCallback(() => map?.zoomIn(), [map]);
  const handleZoomOut = useCallback(() => map?.zoomOut(), [map]);
  const handleResetView = useCallback(() => map?.resetView(), [map]);
  const handleGoTo = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!map) return;
      // Accept any pasted coordinate string — pull the first two numbers out
      // ("1240, 583", "(1240,583)", "1240 583 12" all work).
      const nums = gotoInput.match(/-?\d+(?:\.\d+)?/g);
      if (!nums || nums.length < 2) {
        setGotoError(true);
        return;
      }
      const x = Number(nums[0]);
      const y = Number(nums[1]);
      const targetZoom = Math.max(map.getZoom(), map.getMaxZoom() - 2);
      if (inGameCoordinates && useInGameGoto) {
        // Entered values are in-game coords → convert to a map position [p0, p1].
        map.setView(fromInGameCoords(x, y, inGameCoordinates), targetZoom);
      } else {
        // Marker positions are stored as p = [y, x] (formatCoordinates maps
        // p[1] → {x} and p[0] → {y}), so a displayed (x, y) centers on [y, x].
        map.setView([y, x], targetZoom);
      }
      setGotoError(false);
      setOverflowOpen(false);
    },
    [map, gotoInput, inGameCoordinates, useInGameGoto],
  );
  // Placeholder mirrors the game's own copy format so pasted values line up.
  // In in-game mode the entered values are much smaller, so use a plain example.
  const gotoPlaceholder =
    inGameCoordinates && useInGameGoto
      ? "512, 340"
      : coordinateCopyFormat
        ? coordinateCopyFormat
            .replace("{x}", "1240")
            .replace("{y}", "583")
            .replace("{z}", "")
            .trim()
        : "1240, 583";
  // Only needs whether a player exists (for the follow button), not the
  // position — selecting the boolean re-renders this on null↔present changes
  // instead of on every ~16Hz position update while moving.
  const hasPlayer = useGameState((state) => state.player !== null);
  const followPlayer = useSettingsStore((state) => state.followPlayer);
  const toggleFollowPlayer = useSettingsStore(
    (state) => state.toggleFollowPlayer,
  );

  if (!map || hidden) return null;

  const is3D = pitch > 0.05;
  const showCompassActive = Math.abs(bearing) > 0.01 || is3D;
  const showFollowPlayer = alwaysShowFollowPlayer || hasPlayer;

  return (
    <div className="flex items-center rounded-md border border-input bg-background shadow-sm divide-x divide-input overflow-hidden">
      {/* Compass */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "h-8 w-8 flex items-center justify-center cursor-pointer",
              "hover:bg-accent transition-colors",
              showCompassActive && "text-red-400",
            )}
            aria-label="Compass"
            title="Compass"
          >
            <CompassNeedle bearing={bearing} />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" className="w-auto p-3">
          <CompassPopover
            bearing={bearing}
            pitch={pitch}
            onBearingChange={handleBearingChange}
            onPitchChange={handlePitchChange}
            onResetNorth={handleResetNorth}
          />
        </PopoverContent>
      </Popover>

      {/* Follow player toggle */}
      {showFollowPlayer && (
        <Tooltip delayDuration={200} disableHoverableContent>
          <TooltipTrigger asChild>
            <button
              onClick={toggleFollowPlayer}
              className={cn(
                "h-8 w-8 flex items-center justify-center cursor-pointer",
                "hover:bg-accent transition-colors",
                followPlayer && "text-primary",
              )}
              aria-label={
                followPlayer ? "Stop following player" : "Follow player"
              }
            >
              <Locate className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {followPlayer ? "Stop following player" : "Follow player"}
          </TooltipContent>
        </Tooltip>
      )}

      {/* Zoom in */}
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomIn}
            className="h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom in</TooltipContent>
      </Tooltip>

      {/* Zoom out */}
      <Tooltip delayDuration={200} disableHoverableContent>
        <TooltipTrigger asChild>
          <button
            onClick={handleZoomOut}
            className="h-8 w-8 flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Zoom out</TooltipContent>
      </Tooltip>

      {/* Overflow menu: secondary view controls + go-to-coordinate */}
      <Popover open={overflowOpen} onOpenChange={setOverflowOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "h-8 w-8 flex items-center justify-center cursor-pointer",
              "hover:bg-accent transition-colors",
              (is3D || overflowOpen) && "text-primary",
            )}
            aria-label="More map controls"
            title="More"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-56 p-1">
          <div className="flex flex-col">
            {/* 3D toggle */}
            <button
              type="button"
              onClick={handleToggle3D}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Box className="h-4 w-4" />
              {is3D ? "Switch to 2D" : "Switch to 3D"}
            </button>

            {/* Reset view */}
            <button
              type="button"
              onClick={() => {
                handleResetView();
                setOverflowOpen(false);
              }}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              Reset view
            </button>

            <div className="-mx-1 my-1 h-px bg-muted" />

            {/* Go to coordinate */}
            <form onSubmit={handleGoTo} className="px-2 py-1.5 space-y-1.5">
              <label
                htmlFor="map-goto-coordinate"
                className="flex items-center gap-2 text-sm"
              >
                <MapPin className="h-4 w-4" />
                Go to coordinate
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="map-goto-coordinate"
                  value={gotoInput}
                  onChange={(e) => {
                    setGotoInput(e.target.value);
                    if (gotoError) setGotoError(false);
                  }}
                  placeholder={gotoPlaceholder}
                  className={cn(
                    "h-8 flex-1 min-w-0 rounded-md border bg-background px-2 text-sm",
                    "outline-none focus:ring-1 focus:ring-ring",
                    gotoError ? "border-red-400" : "border-input",
                  )}
                />
                <button
                  type="submit"
                  className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                  Go
                </button>
              </div>
              {inGameCoordinates && (
                <div className="flex items-center gap-2 text-xs select-none">
                  <span className="text-muted-foreground">Coordinates</span>
                  <div className="flex overflow-hidden rounded-md border border-input">
                    <button
                      type="button"
                      onClick={() => toggleInGameGoto(false)}
                      className={cn(
                        "px-2 py-0.5 transition-colors",
                        !useInGameGoto
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      Map
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleInGameGoto(true)}
                      className={cn(
                        "px-2 py-0.5 transition-colors border-l border-input",
                        useInGameGoto
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      In-game
                    </button>
                  </div>
                </div>
              )}
              <p
                className={cn(
                  "text-[10px]",
                  gotoError ? "text-red-400" : "text-muted-foreground",
                )}
              >
                {gotoError
                  ? `Enter as ${gotoPlaceholder}`
                  : "Paste a coordinate to jump there"}
              </p>
            </form>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
