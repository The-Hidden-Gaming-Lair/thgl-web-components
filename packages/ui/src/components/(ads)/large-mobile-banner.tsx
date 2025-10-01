"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdFreeContainer } from "./ad-free-container";
import { AdBlockMessage } from "./ad-block-message";
import { AdLoadingMessage } from "./ad-loading-message";

export function LargeMobileBanner({
  id,
}: {
  id: string;
  mediaQuery?: string;
}): JSX.Element {
  useEffect(() => {
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [["320", "100"]],
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, []);

  return (
    <AdFreeContainer className="w-fit mx-auto">
      <div
        className="rounded h-[100px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500"
        id={id}
      />
    </AdFreeContainer>
  );
}

export function LargeMobileBannerLoading(): JSX.Element {
  return (
    <AdFreeContainer className="w-fit mx-auto">
      <div className="rounded h-[100px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500">
        <AdLoadingMessage />
      </div>
    </AdFreeContainer>
  );
}

export function LargeMobileBannerFallback(): JSX.Element {
  return (
    <AdFreeContainer className="w-fit mx-auto">
      <div className="rounded h-[100px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500">
        <AdBlockMessage hideText />
      </div>
    </AdFreeContainer>
  );
}
