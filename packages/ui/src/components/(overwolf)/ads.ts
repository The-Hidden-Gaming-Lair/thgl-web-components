import { OwAdOptionsSize } from "@overwolf/types/owads";
import { trackEvent } from "../(header)/plausible-tracker";

export function initAd(
  container: HTMLElement,
  size: OwAdOptionsSize,
  variant: string
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

  owAd.addEventListener("player_loaded", () => {
    trackEvent("Ads: Player Loaded", {
      props: {
        variant,
      },
    });
  });
  owAd.addEventListener("display_ad_loaded", () => {
    trackEvent("Ads: Display Ad Loaded", {
      props: {
        variant,
      },
    });
  });
  owAd.addEventListener("play", () => {
    trackEvent("Ads: Play", {
      props: {
        variant,
      },
    });
  });
  owAd.addEventListener("impression", () => {
    trackEvent("Ads: Impression", {
      props: {
        variant,
      },
    });
  });
  owAd.addEventListener("complete", () => {
    trackEvent("Ads: Complete", {
      props: {
        variant,
      },
    });
  });
  owAd.addEventListener("error", () => {
    trackEvent("Ads: Error", {
      props: {
        variant,
      },
    });
  });
  return owAd;
}
