"use client";

import { Layers } from "lucide-react";
import { useEffect, useRef, useState, type JSX } from "react";
import type { InteriorShapesLayer } from "@repo/lib/web-map";
import { cn, type TilesConfig } from "@repo/lib";

/**
 * Always-on name labels for the interior footprints on the surface map. The
 * shapes are WebGL; the labels are DOM. We poll the layer's projected anchors
 * each frame and reposition existing label elements imperatively (via refs) so
 * panning/zooming stays smooth — React only re-renders when the SET of visible
 * interiors changes (i.e. on a map switch), not every frame.
 *
 * Each label shows the interior name followed by INLINE floor-number buttons
 * ("Guard Post 1 2"): its floors = the surface's floor-level maps whose
 * `overlays` include this interior. Clicking a number descends straight to that
 * floor (one click, no menu). Hovering the chip highlights the building's outline
 * (the WebGL footprint, otherwise hidden).
 */
type Anchor = { id: string; mapName: string; label: string };

export function InteriorLabels({
  getLayer,
  getCanvas,
  onEnter,
  tileOptions,
  onSelectFloor,
  activeMap,
}: {
  getLayer: () => InteriorShapesLayer | null;
  getCanvas: () => HTMLCanvasElement | null;
  onEnter: (mapName: string) => void;
  tileOptions: TilesConfig;
  onSelectFloor: (mapName: string) => void;
  /** The currently-viewed map — the matching floor button is marked active. */
  activeMap: string;
}): JSX.Element {
  const [labels, setLabels] = useState<Anchor[]>([]);
  const elRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    let raf = 0;
    let prevKey = "";
    const loop = () => {
      const anchors = getLayer()?.getLabels() ?? [];
      const key = anchors
        .map((a) => a.id)
        .sort()
        .join("|");
      if (key !== prevKey) {
        prevKey = key;
        setLabels(
          anchors.map((a) => ({
            id: a.id,
            mapName: a.mapName,
            label: a.label,
          })),
        );
      }
      for (const a of anchors) {
        const el = elRefs.current.get(a.id);
        if (el) {
          el.style.transform = `translate(-50%, -50%) translate(${a.x}px, ${a.y}px)`;
          el.style.display = "";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [getLayer]);

  // The floors of an interior: the surface's floor-level maps that include it.
  const floorsFor = (mapName: string, label: string) => {
    const surface = tileOptions[mapName]?.layer?.parent;
    if (!surface) return [] as { id: string; floor: number }[];
    return Object.entries(tileOptions)
      .filter(
        ([, c]) =>
          c.layer?.parent === surface &&
          c.overlays?.some((o) => o.label === label),
      )
      .map(([id, c]) => ({ id, floor: c.layer!.floor }))
      .sort((a, b) => a.floor - b.floor);
  };

  // Hovering a label/menu otherwise swallows wheel-zoom — forward it to the canvas.
  const fwdWheel = (e: React.WheelEvent) => {
    const cv = getCanvas();
    if (!cv) return;
    cv.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true,
        cancelable: true,
      }),
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {labels.map((l) => {
        const floors = floorsFor(l.mapName, l.label);
        return (
          <div
            key={l.id}
            ref={(el) => {
              if (el) elRefs.current.set(l.id, el);
              else elRefs.current.delete(l.id);
            }}
            style={{ position: "absolute", left: 0, top: 0, display: "none" }}
            // The whole chip highlights the building outline on hover.
            onMouseEnter={() => getLayer()?.setHighlighted(l.id)}
            onMouseLeave={() => getLayer()?.setHighlighted(null)}
            onWheel={fwdWheel}
            className="pointer-events-auto flex items-center gap-1 whitespace-nowrap rounded-sm border border-white/15 bg-slate-900/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-100 shadow-sm backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-slate-800/90"
          >
            <Layers className="h-3 w-3 shrink-0 opacity-70" />
            <span>{l.label}</span>
            {/* Inline floor numbers — one click descends to that floor. */}
            {floors.length > 1 ? (
              floors.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFloor(f.id)}
                  onFocus={() => getLayer()?.setHighlighted(l.id)}
                  onBlur={() => getLayer()?.setHighlighted(null)}
                  className={cn(
                    "flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-sm px-1 text-[10px] font-semibold transition-colors",
                    f.id === activeMap
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-slate-100 hover:bg-primary hover:text-primary-foreground",
                  )}
                  title={`${l.label} — Floor ${f.floor}`}
                  aria-label={`${l.label} Floor ${f.floor}`}
                >
                  {f.floor}
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={() => onEnter(l.mapName)}
                className="cursor-pointer"
                aria-label={`Enter ${l.label}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
