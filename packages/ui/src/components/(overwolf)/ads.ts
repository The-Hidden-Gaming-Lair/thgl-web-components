import { OwAdOptionsSize } from "@overwolf/types/owads";
import { trackEvent } from "../(header)/plausible-tracker";

export function initAd(
  container: HTMLElement,
  size: OwAdOptionsSize,
  variant: string,
) {
  if (typeof window.OwAd === "undefined") {
    return;
  }

  const owAd = new window.OwAd(container, {
    size: size,
  });
  trackEvent("Ads: Loaded", {
    props: {
      variant,
    },
  });
  return owAd;
}
