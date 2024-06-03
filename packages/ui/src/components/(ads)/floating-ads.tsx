import { AdBlocker } from "./ad-blocker";
import { FloatingBanner } from "./floating-banner";
import { FloatingMobileBanner } from "./mobile-banner";
import { NitroScript } from "./nitro-script";
import { NitroPayVideoPlayer } from "./nitropay-video-player";

export function FloatingAds({ id }: { id: string }): JSX.Element {
  return (
    <NitroScript fallback={<AdBlocker />}>
      <NitroPayVideoPlayer id={`${id}:video`} />
      <FloatingBanner id={`${id}:floating-banner`} />
      <FloatingMobileBanner id={`${id}:mobile-banner`} />
    </NitroScript>
  );
}
