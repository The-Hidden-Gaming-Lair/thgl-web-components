"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";

export function WideSkyscraper({
  id,
  mediaQuery = "(min-width: 860px)",
}: {
  id: string;
  mediaQuery?: string;
}): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  useEffect(() => {
    if (!matched) {
      return;
    }
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [["160", "600"]],
      mediaQuery: mediaQuery,
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, [matched]);

  if (!matched) {
    return <></>;
  }

  return (
    <>
      <div className="w-[160px]"></div>
      <AdFreeContainer className="fixed">
        <div
          className="bg-zinc-800/30 text-gray-500 flex-col justify-center text-center h-[600px] w-[160px]"
          id={id}
        />
      </AdFreeContainer>
    </>
  );
}

export function WideSkyscraperLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("min-[1024px]:block hidden", className)}>
      <div
        className={cn(
          "flex bg-zinc-800/30 text-gray-500 flex-col justify-center text-center h-[600px] w-[160px]",
        )}
      >
        Loading Ad
      </div>
    </AdFreeContainer>
  );
}

export function WideSkyscraperFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("min-[1024px]:block hidden", className)}>
      <div
        className={cn(
          "flex bg-zinc-800/30 text-gray-500 flex-col justify-center text-center h-[600px] w-[160px]",
        )}
      >
        Please disable your Ad-Blocker
      </div>
    </AdFreeContainer>
  );
}
