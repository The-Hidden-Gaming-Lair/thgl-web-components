"use client";
import type { EventOptions, PlausibleOptions } from "plausible-tracker";
import Plausible from "plausible-tracker";
import { useEffect } from "react";

let plausible: ReturnType<typeof Plausible> | null = null;
let lastActionTimestamp = 0;
const KEEP_ALIVE_TIMEOUT = 4 * 60 * 1000;
let timeoutId: NodeJS.Timeout | null = null;

const keepAlive = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  const now = Date.now();
  const diff = now - lastActionTimestamp;
  if (diff > KEEP_ALIVE_TIMEOUT) {
    trackEvent("Keep Alive");
    return;
  }
  timeoutId = setTimeout(() => {
    trackEvent("Keep Alive");
  }, KEEP_ALIVE_TIMEOUT - diff);
};

export const initPlausible = (domain: string, apiHost: string) => {
  if (plausible) {
    return;
  }

  plausible = Plausible({
    domain,
    apiHost,
    trackLocalhost: true,
  });
  plausible.enableAutoPageviews();
  lastActionTimestamp = Date.now();

  let isHidden = document.hidden;
  if (!isHidden) {
    keepAlive();
  }
  document.addEventListener("visibilitychange", () => {
    if (isHidden === document.hidden) {
      return;
    }
    isHidden = document.hidden;
    if (isHidden) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } else {
      keepAlive();
    }
  });
};

export const trackEvent = (
  eventName: string,
  options?: EventOptions | undefined,
  eventData?: PlausibleOptions | undefined,
) => {
  if (plausible) {
    lastActionTimestamp = Date.now();
    plausible.trackEvent(eventName, options, eventData);
    keepAlive();
  }
};

export const trackOutboundLinkClick = (url: string) => {
  trackEvent("Outbound Link: Click", { props: { url: url } });
};

export const trackCustomEvent = (name: string, url: string) => {
  trackEvent(name, { props: { url: url } });
};

export const trackVersion = (version: string) => {
  trackEvent("Version", { props: { version: version } });
};

export function PlausibleTracker({
  domain,
  apiHost,
  version,
}: {
  domain: string;
  apiHost: string;
  version?: string;
}) {
  useEffect(() => {
    initPlausible(domain, apiHost);
    if (version) {
      trackVersion(version);
    }
  }, []);

  return <></>;
}
