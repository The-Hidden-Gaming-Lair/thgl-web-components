"use client";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { AdBlockMessage } from "./ad-block-message";
import { AdLoadingMessage } from "./ad-loading-message";

const smallMediaQuery = "(min-width: 768px)";
export function FloatingMobileBanner({
  bannerId,
  videoId,
  isLoading = false,
  isBlocked = false,
}: {
  bannerId: string;
  videoId: string;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const matched = useMediaQuery(smallMediaQuery);

  useEffect(() => {
    if (matched || isLoading || isBlocked) {
      return;
    }
    getNitroAds().createAd(bannerId, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [["320", "50"]],
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
    getNitroAds().createAd(videoId, {
      refreshTime: 30,
      format: "floating",
      report: {
        enabled: true,
        icon: true,
        wording: "Report Ad",
        position: "top-left",
      },
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, [matched]);

  if (matched) {
    return <></>;
  }

  if (isLoading) {
    return (
      <AdFreeContainer
        className={"w-fit mx-auto fixed bottom-0 right-0 z-[99999]"}
      >
        <div className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500 ">
          <AdLoadingMessage />
        </div>
      </AdFreeContainer>
    );
  }

  if (isBlocked) {
    return (
      <AdFreeContainer
        className={"w-fit mx-auto fixed bottom-0 right-0 z-[99999]"}
      >
        <div className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500 ">
          <AdBlockMessage hideText />
        </div>
      </AdFreeContainer>
    );
  }
  return (
    <AdFreeContainer
      className={"w-fit mx-auto fixed bottom-0 right-0 z-[99999]"}
      closable={
        <div className="rounded h-[133.4px] w-full bg-zinc-800/30 flex flex-col justify-center text-gray-500 mx-auto">
          <div id={videoId} className="h-full w-full" />
        </div>
      }
    >
      <div
        className="rounded h-[50px] w-[320px] bg-zinc-800/30 flex flex-col justify-center text-gray-500"
        id={bannerId}
      />
    </AdFreeContainer>
  );
}
