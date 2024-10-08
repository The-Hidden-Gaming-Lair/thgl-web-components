"use client";

import { AdBlocker } from "./ad-blocker";
import { FloatingBanner } from "./floating-banner";
import { FloatingMobileBanner } from "./floating-mobile-banner";
import { NitroScript } from "./nitro-script";
import {
  NitroPayVideoPlayer,
  NitroPayVideoPlayerLoading,
} from "./nitropay-video-player";

export function FloatingAds({ id }: { id: string }): JSX.Element {
  return (
    <NitroScript
      fallback={<AdBlocker />}
      loading={<NitroPayVideoPlayerLoading id={`${id}:video`} />}
    >
      <NitroPayVideoPlayer id={`${id}:video`} />
      <FloatingBanner id={`${id}:floating-banner`} />
      <FloatingMobileBanner id={`${id}:mobile-banner`} />
    </NitroScript>
  );
}
