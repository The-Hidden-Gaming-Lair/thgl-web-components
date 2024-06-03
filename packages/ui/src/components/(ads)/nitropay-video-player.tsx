"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";

const mediaQuery = "(min-width: 768px)";
export function NitroPayVideoPlayer({ id }: { id: string }): JSX.Element {
  const matched = useMediaQuery(mediaQuery);

  useEffect(() => {
    if (!matched) {
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
  return (
    <AdFreeContainer>
      <div className="max-w-[400px] min-h-[170px]" id={id} />
    </AdFreeContainer>
  );
}
