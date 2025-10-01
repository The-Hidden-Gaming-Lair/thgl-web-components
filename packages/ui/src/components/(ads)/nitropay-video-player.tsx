"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";
import { AdBlockMessage } from "./ad-block-message";
import { AdLoadingMessage } from "./ad-loading-message";

const mediaQuery = "(min-width: 768px)";
export function NitroPayVideoPlayer({
  id,
  isLoading = false,
  isBlocked = false,
}: {
  id: string;
  isLoading?: boolean;
  isBlocked?: boolean;
}): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  useEffect(() => {
    if (!matched || isLoading || isBlocked) {
      return;
    }
    getNitroAds().createAd(id, {
      format: "video-nc",
      video: {
        mobile: "compact",
        interval: 10,
      },
      mediaQuery: mediaQuery,
      debug: "silent",
    });
  }, [matched]);

  if (!matched) {
    return <></>;
  }
  if (isLoading) {
    return (
      <AdFreeContainer className="md:block hidden">
        <div
          className="max-w-[400px] h-[170px] lg:h-[203px] flex items-center justify-center flex-col"
          id={id}
        >
          <AdLoadingMessage />
        </div>
      </AdFreeContainer>
    );
  }

  if (isBlocked) {
    return (
      <AdFreeContainer className="md:block hidden">
        <div
          className="max-w-[400px] h-[170px] lg:h-[203px] flex items-center justify-center flex-col"
          id={id}
        >
          <AdBlockMessage />
        </div>
      </AdFreeContainer>
    );
  }
  return (
    <AdFreeContainer>
      <div className="max-w-[400px] h-[170px] lg:h-[203px]" id={id} />
    </AdFreeContainer>
  );
}
