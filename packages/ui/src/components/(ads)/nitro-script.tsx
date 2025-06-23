"use client";
import { isOverwolf, useAccountStore } from "@repo/lib";
import Script from "next/script";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { create } from "zustand";
import { NitroAds } from "./nitro-pay";

const useNitroState = create<{
  state: "loading" | "error" | "ready";
  setState: (state: "loading" | "error" | "ready") => void;
}>((set) => ({
  state: "loading",
  setState: (state) => {
    set({ state });
  },
}));

export function NitroScript({
  children,
  fallback,
  loading,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}): JSX.Element {
  const accountHasHydrated = useAccountStore((state) => state._hasHydrated);
  const adRemoval = useAccountStore((state) => state.perks.adRemoval);
  const { state, setState } = useNitroState();

  useEffect(() => {
    if (state !== "loading" || adRemoval || isOverwolf) {
      return;
    }
    const now = Date.now();
    const intervalId = setInterval(() => {
      if (Date.now() - now > 2000) {
        setState("error");
        clearInterval(intervalId);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [state]);

  if (!accountHasHydrated) {
    return <>{loading}</>;
  }
  if (adRemoval || isOverwolf) {
    return <></>;
  }

  return (
    <>
      <Script
        onError={() => {
          console.log("NitroAds onError failed to load");
          setState("error");
        }}
        strategy="lazyOnload"
        onReady={() => {
          if (
            "nitroAds" in window &&
            (window.nitroAds as NitroAds).siteId === 1487
          ) {
            console.log("NitroAds script is ready");
            setState("ready");
          } else {
            console.log("NitroAds onReady failed to load");
            setState("error");
          }
        }}
        src="https://s.nitropay.com/ads-1487.js"
      />
      {state === "loading" && loading}
      {state === "ready" && children}
      {state === "error" && fallback}
    </>
  );
}
