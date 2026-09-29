"use client";
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";

// In-content banners switch from their phone size to a 728x90 leaderboard
// when the CONTENT column (not the viewport) has room for it: with the
// database sidebar and the side rails, a 1280px window leaves < 728px.
const LEADERBOARD = { width: 728, height: 90 };
const FRAME = 2; // AdFreeContainer border

type Size = { width: number; height: number };

function useFitsLeaderboard(
  el: React.RefObject<HTMLDivElement | null>,
): boolean | null {
  const [fits, setFits] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    if (!el.current) return;
    const update = (width: number) => {
      // Hidden/minimised layouts report 0 — keep the current decision.
      if (width === 0) return;
      setFits(width >= LEADERBOARD.width + FRAME);
    };
    update(el.current.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      update(entry.contentRect.width),
    );
    observer.observe(el.current);
    return () => observer.disconnect();
  }, [el]);
  return fits;
}

export function InContentBanner({
  id,
  targeting,
  phone,
  phoneId,
  state = "ad",
  hideBlockedText = false,
  className,
}: {
  id: string;
  targeting?: Record<string, string>;
  phone: Size;
  /** Unit id for the phone size when it differs from `id` (new size = new unit) */
  phoneId?: string;
  state?: "ad" | "loading" | "blocked";
  hideBlockedText?: boolean;
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const fits = useFitsLeaderboard(ref);
  const size = fits ? LEADERBOARD : phone;
  // The leaderboard is its own ad unit so NitroPay floors and reports it
  // separately from the phone banner.
  const unitId = fits ? `${id}-lb` : (phoneId ?? id);

  return (
    <div ref={ref} className={className}>
      {fits === null ? null : state === "ad" ? (
        <BannerSlot
          key={unitId}
          id={unitId}
          size={size}
          targeting={targeting}
        />
      ) : (
        <AdPlaceholder
          type={state}
          width=""
          height=""
          style={size}
          className="w-fit mx-auto"
          hideBlockedText={hideBlockedText}
        />
      )}
    </div>
  );
}

function BannerSlot({
  id,
  size,
  targeting,
}: {
  id: string;
  size: Size;
  targeting?: Record<string, string>;
}): JSX.Element {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting, // Custom targeting for reporting filters
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [[String(size.width), String(size.height)]],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[InContentBanner] Failed to create ad ${id}:`, error);
    }
    // Depend on the targeting *values* (not the object reference) — see
    // wide-skyscrapper.tsx for full context.
  }, [id, targeting?.game, targeting?.platform]);

  return (
    <AdFreeContainer className="w-fit mx-auto">
      <div
        className="rounded bg-zinc-800/30 flex flex-col justify-center text-gray-500"
        style={size}
        id={id}
      />
    </AdFreeContainer>
  );
}
