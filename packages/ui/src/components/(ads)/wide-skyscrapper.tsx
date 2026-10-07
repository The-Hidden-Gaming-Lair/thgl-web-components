"use client";
import { useEffect, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";
import { AdSlot } from "./house-ad";

// Wide screens get 300px rails holding stacked 300x250 rectangles (they
// earn more per screen area than one 300x600). A rectangle is only created
// when it fits on screen: the rail starts ~94px down, plus the 18px header,
// then 250px per slot with 8px gaps. Three per rail keep both rails under
// ~30% of the screen (Better Ads Standards limit for sticky desktop ads).
const WIDE_QUERY = "(min-width: 1680px)";
const TWO_QUERY = "(min-width: 1680px) and (min-height: 625px)";
const THREE_QUERY = "(min-width: 1680px) and (min-height: 880px)";

export function WideSkyscraper({
  id,
  targeting,
  mediaQuery = "(min-width: 860px)",
}: {
  id: string;
  targeting?: Record<string, string>;
  mediaQuery?: string;
}): JSX.Element {
  const matched = useMediaQuery(mediaQuery);
  const wide = useMediaQuery(WIDE_QUERY);
  const two = useMediaQuery(TWO_QUERY);
  const three = useMediaQuery(THREE_QUERY);

  if (!matched) {
    return <></>;
  }

  // Each rectangle is its own ad unit so it reports and floors separately.
  const rects = three ? 3 : two ? 2 : 1;
  return (
    <>
      <div className={wide ? "w-[300px]" : "w-[160px]"}></div>
      <AdFreeContainer className="fixed">
        <div className="flex flex-col gap-2">
          {wide ? (
            Array.from({ length: rects }, (_, i) => (
              <RailSlot
                key={`${id}-r${i + 1}`}
                id={`${id}-r${i + 1}`}
                targeting={targeting}
                mediaQuery={mediaQuery}
                sizes={[["300", "250"]]}
                className="h-[250px] w-[300px]"
              />
            ))
          ) : (
            <RailSlot
              key={id}
              id={id}
              targeting={targeting}
              mediaQuery={mediaQuery}
              sizes={[["160", "600"]]}
              className="h-[600px] w-[160px]"
            />
          )}
        </div>
      </AdFreeContainer>
    </>
  );
}

function RailSlot({
  id,
  targeting,
  mediaQuery,
  sizes,
  className,
}: {
  id: string;
  targeting?: Record<string, string>;
  mediaQuery: string;
  sizes: string[][];
  className: string;
}): JSX.Element {
  useEffect(() => {
    try {
      getNitroAds().createAd(id, {
        targeting, // Custom targeting for reporting filters
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes,
        mediaQuery: mediaQuery,
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(`[WideSkyscraper] Failed to create ad ${id}:`, error);
    }
    // Depend on the `targeting` *values* (not the object reference) so soft
    // navigations within the same layout don't keep firing `createAd` for the
    // same DOM id. Server-rendered parent passes a fresh `targeting` object
    // each render, which previously made this effect re-run on every nav.
  }, [id, targeting?.game, targeting?.platform, mediaQuery]);

  return (
    <AdSlot
      id={id}
      className={cn(
        "bg-zinc-800/30 text-gray-500 flex-col justify-center text-center",
        className,
      )}
    />
  );
}

export function WideSkyscraperLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdPlaceholder
      type="loading"
      width="w-[160px] min-[1680px]:w-[300px]"
      height="h-[600px]"
      className={cn("min-[1024px]:block hidden", className)}
      displayCheck={false}
    />
  );
}

export function WideSkyscraperFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdPlaceholder
      type="blocked"
      width="w-[160px] min-[1680px]:w-[300px]"
      height="h-[600px]"
      className={cn("min-[1024px]:block hidden", className)}
    />
  );
}
