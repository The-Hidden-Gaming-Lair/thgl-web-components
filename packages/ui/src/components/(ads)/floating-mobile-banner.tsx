"use client";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { useEffect, type JSX } from "react";
import { getNitroAds } from "./nitro-pay";
import { IS_DEMO_MODE } from "./constants";
import { AdPlaceholder } from "./ad-placeholder";
import { AdSlot } from "./house-ad";

const smallMediaQuery = "(min-width: 768px)";
export function FloatingMobileBanner({
  bannerId,
  videoId,
  targeting,
  isLoading = false,
  isBlocked = false,
}: {
  bannerId: string;
  videoId: string;
  targeting?: Record<string, string>;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const matched = useMediaQuery(smallMediaQuery);

  useEffect(() => {
    if (matched || isLoading || isBlocked) {
      return;
    }
    try {
      getNitroAds().createAd(bannerId, {
        targeting,
        refreshTime: 30,
        renderVisibleOnly: false,
        sizes: [["320", "50"]],
        demo: IS_DEMO_MODE,
        debug: "silent",
      });
    } catch (error) {
      console.error(
        `[FloatingMobileBanner] Failed to create ad ${bannerId}:`,
        error,
      );
    }
    // Depend on the targeting *values* (not the object reference) — see
    // wide-skyscrapper.tsx for full context.
  }, [
    matched,
    bannerId,
    targeting?.game,
    targeting?.platform,
    isLoading,
    isBlocked,
  ]);

  if (matched) {
    return <></>;
  }

  if (isLoading) {
    return (
      <AdPlaceholder
        type="loading"
        width="w-[320px]"
        height="h-[50px]"
        className="fixed bottom-0 left-0 z-99999"
      />
    );
  }

  if (isBlocked) {
    return (
      <AdPlaceholder
        type="blocked"
        width="w-[320px]"
        height="h-[50px]"
        className="fixed bottom-0 left-0 z-99999"
      />
    );
  }
  return (
    <AdFreeContainer className="fixed bottom-0 left-0 z-99999">
      <AdSlot
        id={bannerId}
        className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500"
      />
    </AdFreeContainer>
  );
}
