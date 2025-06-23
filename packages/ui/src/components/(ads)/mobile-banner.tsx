"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";
import { cn } from "@repo/lib";
import { AdBlockMessage } from "./ad-block-message";
import { AdLoadingMessage } from "./ad-loading-message";

export function MobileBanner({
  id,
  className,
}: {
  id: string;
  className?: string;
}): JSX.Element {
  useEffect(() => {
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [["320", "50"]],
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, []);

  return (
    <AdFreeContainer className={cn("w-fit mx-auto", className)}>
      <div
        className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500"
        id={id}
      />
    </AdFreeContainer>
  );
}

export function MobileBannerLoading({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("w-fit mx-auto", className)}>
      <div className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500">
        <AdLoadingMessage />
      </div>
    </AdFreeContainer>
  );
}

export function MobileBannerFallback({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <AdFreeContainer className={cn("w-fit mx-auto", className)}>
      <div className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500">
        <AdBlockMessage hideText />
      </div>
    </AdFreeContainer>
  );
}
