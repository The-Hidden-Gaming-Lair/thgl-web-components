"use client";

// Hover card of a codex entry (stats + description). Above everything, the map's marker
// tooltip (z 999999) included: codex links inside a marker tooltip show it too.

import { gameApiUrl } from "@repo/lib";
import { useState, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipData = {
  name: string;
  type: string;
  desc: string | null;
  bonuses: string[];
  stats: string[];
  extras?: { label: string; value: string }[];
};

const cache = new Map<string, TooltipData>();
const pending = new Map<string, Promise<TooltipData | null>>();

function fetchTooltip(
  entityId: string,
  locale: string,
): Promise<TooltipData | null> {
  const key = `${entityId}_${locale}`;
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const existing = pending.get(key);
  if (existing) return existing;
  const promise = fetch(
    gameApiUrl(`/api/db/entity-tooltip?id=${entityId}&locale=${locale}`),
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((d) => {
      if (d && !d.error) {
        cache.set(key, d);
        return d as TooltipData;
      }
      return null;
    })
    .finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

export function EntityTooltip({
  entityId,
  locale = "en",
  children,
  className = "inline-flex",
}: {
  entityId: string;
  locale?: string;
  children: ReactNode;
  /** Tailwind classes for the wrapper span. Override to `"block w-full"`
   *  when wrapping a full-width grid cell so the child fills its column. */
  className?: string;
}) {
  const [data, setData] = useState<TooltipData | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  const fetchData = useCallback(() => {
    if (cache.has(`${entityId}_${locale}`)) {
      setData(cache.get(`${entityId}_${locale}`)!);
      return;
    }
    setLoading(true);
    fetchTooltip(entityId, locale).then((d) => {
      if (d) setData(d);
      setLoading(false);
    });
  }, [entityId, locale]);

  const handleEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    timerRef.current = setTimeout(() => {
      fetchData();
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const tooltipW = 288;
        let x = rect.left;
        // Keep within viewport
        if (x + tooltipW > window.innerWidth - 8) {
          x = window.innerWidth - tooltipW - 8;
        }
        if (x < 8) x = 8;
        // Show above if near bottom, below otherwise
        const spaceAbove = rect.top;
        const y =
          spaceAbove > 200
            ? rect.top - 4 // above
            : rect.bottom + 4; // below
        setPos({ x, y: y });
      }
      setVisible(true);
    }, 250);
  };

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), 100);
  };

  const hasContent =
    data &&
    (data.desc ||
      data.bonuses.length > 0 ||
      data.stats.length > 0 ||
      (data.extras && data.extras.length > 0));

  return (
    <span
      ref={containerRef}
      className={className}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
      {visible &&
        (hasContent || loading) &&
        pos &&
        createPortal(
          <div
            className="fixed w-72 rounded-lg border border-neutral-700 bg-zinc-900 shadow-2xl p-3 pointer-events-none"
            style={{
              zIndex: 1000001,
              left: pos.x,
              top: pos.y,
              transform:
                containerRef.current &&
                containerRef.current.getBoundingClientRect().top > 200
                  ? "translateY(-100%)"
                  : undefined,
            }}
          >
            {loading && !data && (
              <div className="text-xs text-muted-foreground">Loading...</div>
            )}
            {hasContent && (
              <>
                {data.stats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {data.stats.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {data.desc && (
                  <p className="text-xs text-muted-foreground italic mb-2 whitespace-pre-line">
                    {data.desc}
                  </p>
                )}
                {data.bonuses.length > 0 && (
                  <ul className="space-y-1">
                    {data.bonuses.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="text-amber-500 mt-px shrink-0">
                          &#x25C6;
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {data.extras && data.extras.length > 0 && (
                  <ul
                    className={`space-y-1 ${data.bonuses.length > 0 || data.desc ? "mt-2 pt-2 border-t border-slate-800/50" : ""}`}
                  >
                    {data.extras.map((e, i) => (
                      <li key={i} className="text-xs">
                        <span className="text-muted-foreground">
                          {e.label}:{" "}
                        </span>
                        <span className="text-slate-200">{e.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>,
          document.body,
        )}
    </span>
  );
}
