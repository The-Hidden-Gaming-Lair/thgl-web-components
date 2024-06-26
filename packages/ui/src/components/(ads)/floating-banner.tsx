"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { useMediaQuery } from "@uidotdev/usehooks";
import { AdFreeContainer } from "./ad-free-container";

const smallMediaQuery = "(min-width: 768px)";
const bigMediaQuery = "(min-width: 1250px)";
export function FloatingBanner({ id }: { id: string }): JSX.Element {
  const smallMatched = useMediaQuery(smallMediaQuery);
  const bigMatched = useMediaQuery(bigMediaQuery);

  useEffect(() => {
    if (!smallMatched) {
      return;
    }
    const sizes = bigMatched
      ? [
          ["300", "600"],
          ["160", "600"],
          ["300", "250"],
        ]
      : [["160", "600"]];
    console.log(sizes);
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: sizes,
      mediaQuery: smallMediaQuery,
      debug: "silent",
      demo: location.href.includes("localhost"),
    });
  }, [smallMatched, bigMatched]);

  if (!smallMatched) {
    return <></>;
  }
  return (
    <AdFreeContainer className="fixed bottom-2 right-2 min-h-[250px] min-w-[160px]">
      <div id={id} />
    </AdFreeContainer>
  );
}
