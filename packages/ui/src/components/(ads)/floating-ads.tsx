"use client";
import { AdBlocker } from "./ad-blocker";
import dynamic from "next/dynamic";

const FloatingBanner = dynamic(
  () => import("./floating-banner").then((mod) => mod.FloatingBanner),
  { ssr: false },
);
const FloatingMobileBanner = dynamic(
  () =>
    import("./floating-mobile-banner").then((mod) => mod.FloatingMobileBanner),
  { ssr: false },
);
const NitroPayVideoPlayer = dynamic(
  () =>
    import("./nitropay-video-player").then((mod) => mod.NitroPayVideoPlayer),
  { ssr: false },
);
import { NitroScript } from "./nitro-script";

export function FloatingAds({ id }: { id: string }): JSX.Element {
  return (
    <NitroScript
      fallback={
        <>
          <AdBlocker />
          <NitroPayVideoPlayer id={`${id}:video`} isBlocked />
          <FloatingBanner id={`${id}:floating-banner`} isBlocked />
          <FloatingMobileBanner
            bannerId={`${id}:mobile-banner`}
            videoId={`${id}:mobile-video`}
            isBlocked
          />
        </>
      }
      loading={
        <>
          <NitroPayVideoPlayer id={`${id}:video`} isLoading />
          <FloatingBanner id={`${id}:floating-banner`} isLoading />
          <FloatingMobileBanner
            bannerId={`${id}:mobile-banner`}
            videoId={`${id}:mobile-video`}
            isLoading
          />
        </>
      }
    >
      <NitroPayVideoPlayer id={`${id}:video`} />
      <FloatingBanner id={`${id}:floating-banner`} />
      <FloatingMobileBanner
        bannerId={`${id}:mobile-banner`}
        videoId={`${id}:mobile-video`}
      />
    </NitroScript>
  );
}
