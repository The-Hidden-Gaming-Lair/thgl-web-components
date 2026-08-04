"use client";

import { Layers } from "lucide-react";
import { useEffect, useRef, useState, type JSX } from "react";
import type { InteriorShapesLayer } from "@repo/lib/web-map";

/**
 * Always-on name labels for the interior footprints drawn on the surface map.
 * The shapes are WebGL; the labels are DOM. We poll the layer's projected
 * anchors each frame and reposition existing label elements imperatively (via
 * refs) so panning/zooming stays smooth — React only re-renders when the SET of
 * visible interiors changes (i.e. on a map switch), not every frame. Each label
 * is itself clickable to descend into that interior.
 */
export function InteriorLabels({
  getLayer,
  getCanvas,
  onEnter,
}: {
  getLayer: () => InteriorShapesLayer | null;
  getCanvas: () => HTMLCanvasElement | null;
  onEnter: (mapName: string) => void;
}): JSX.Element {
  const [labels, setLabels] = useState<
    { id: string; mapName: string; label: string }[]
  >([]);
  const elRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

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

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {labels.map((l) => (
        <button
          key={l.id}
          ref={(el) => {
            if (el) elRefs.current.set(l.id, el);
            else elRefs.current.delete(l.id);
          }}
          type="button"
          onClick={() => onEnter(l.mapName)}
          onMouseEnter={() => getLayer()?.setHighlighted(l.id)}
          onMouseLeave={() => getLayer()?.setHighlighted(null)}
          onFocus={() => getLayer()?.setHighlighted(l.id)}
          onBlur={() => getLayer()?.setHighlighted(null)}
          // The label is interactive (click + hover), which otherwise swallows
          // wheel-zoom over it — forward the wheel to the map canvas so hovering
          // a label never blocks zooming.
          onWheel={(e) => {
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
          }}
          style={{ position: "absolute", left: 0, top: 0, display: "none" }}
          className="pointer-events-auto flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-sm border border-white/15 bg-slate-900/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-100 shadow-sm backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-slate-800/90 hover:text-white"
        >
          <Layers className="h-3 w-3 shrink-0 opacity-70" />
          {l.label}
        </button>
      ))}
    </div>
  );
}
