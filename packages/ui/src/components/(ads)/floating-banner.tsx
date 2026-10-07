"use client";
import { useEffect, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";
import { AdSlot } from "./house-ad";

const smallMediaQuery = "(min-width: 768px)";
const bigMediaQuery = "(min-width: 1250px)";
// Viewport tall enough for a 600px sidebar ad without overlapping map controls
const tallMediaQuery = "(min-height: 750px)";

// Stacked rectangles earn more per screen area than one tall unit, so the
// big variant is two 300x250s (508px) instead of a 300x600, and tablet-width
// windows (768-1249px) get one 300x250 instead of a 160x600.
type AdVariant = "stack" | "rect" | "compact";

const RECT: [string, string] = ["300", "250"];
const GAP = 8;

export function FloatingBanner({
  id,
  targeting,
  isLoading = false,
  isBlocked = false,
}: {
  id: string;
  targeting?: Record<string, string>;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const smallMatched = useMediaQuery(smallMediaQuery);
  const bigMatched = useMediaQuery(bigMediaQuery);
  const tallMatched = useMediaQuery(tallMediaQuery);

  if (!smallMatched) {
    return <></>;
  }

  const variant: AdVariant = !tallMatched
    ? "compact"
    : bigMatched
      ? "stack"
      : "rect";

  // Key forces remount when variant changes, ensuring clean ad recreation
  return (
    <FloatingBannerInner
      key={variant}
      id={id}
      variant={variant}
      targeting={targeting}
      isLoading={isLoading}
      isBlocked={isBlocked}
    />
  );
}

function FloatingBannerInner({
  id,
  variant,
  targeting,
  isLoading = false,
  isBlocked = false,
}: {
  id: string;
  variant: AdVariant;
  targeting?: Record<string, string>;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  // Each slot is its own ad unit: <id>-stack-1/-2, <id>-rect, <id>-compact.
  const slots =
    variant === "stack"
      ? [`${id}-stack-1`, `${id}-stack-2`]
      : [`${id}-${variant}`];
  const sizes: [string, string][] =
    variant === "compact" ? [RECT, ["320", "100"]] : [RECT];
  const height = slots.length * 250 + (slots.length - 1) * GAP;

  useEffect(() => {
    if (isLoading || isBlocked) return;
    for (const slotId of slots) {
      try {
        getNitroAds().createAd(slotId, {
          targeting,
          refreshTime: 30,
          renderVisibleOnly: false,
          sizes,
          mediaQuery: smallMediaQuery,
          debug: "silent",
          demo: IS_DEMO_MODE,
        });
      } catch (error) {
        console.error(`[FloatingBanner] Failed to create ad ${slotId}:`, error);
      }
    }
  }, [id, variant, isLoading, isBlocked]);

  if (isLoading || isBlocked) {
    return (
      <AdPlaceholder
        type={isLoading ? "loading" : "blocked"}
        width="w-[300px]"
        height=""
        style={{ height }}
        className="fixed bottom-2 right-2"
      />
    );
  }

  return (
    <AdFreeContainer className="fixed bottom-2 right-2">
      <div className="flex flex-col" style={{ gap: GAP }}>
        {slots.map((slotId) => (
          <AdSlot key={slotId} id={slotId} className="h-[250px] w-[300px]" />
        ))}
      </div>
    </AdFreeContainer>
  );
}
