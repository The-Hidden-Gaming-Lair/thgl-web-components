import type { OwAd } from "@overwolf/types/owads";
import { useAccountStore } from "@repo/lib";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { trackEvent } from "../(header)";

declare global {
  interface Window {
    OwAd?: typeof OwAd;
  }
}

let script: HTMLScriptElement | null = null;
export function AdsScript({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}): JSX.Element {
  const adRemoval = useAccountStore((state) => state.adRemoval);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    if (state !== "loading" || adRemoval) {
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = "https://content.overwolf.com/libs/ads/latest/owads.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
    const handleLoad = () => {
      if (typeof window.OwAd === "undefined") {
        return;
      }
      setState("ready");
      trackEvent("Ads: Ready");
    };
    const handleError = () => {
      setState("error");
      trackEvent("Ads: Error");
    };
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      script!.removeEventListener("load", handleLoad);
      script!.removeEventListener("load", handleError);
    };
  }, [state, adRemoval]);

  if (adRemoval) {
    return <></>;
  }

  return (
    <>
      {state === "ready" && children}
      {state === "error" && fallback}
    </>
  );
}
