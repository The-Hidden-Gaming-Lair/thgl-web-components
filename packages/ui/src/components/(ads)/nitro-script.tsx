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
  const adRemoval = useAccountStore((state) => state.adRemoval);
  const { state, setState } = useNitroState();

  useEffect(() => {
    if (state !== "loading" || adRemoval || isOverwolf) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setState("error");
    }, 1499);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [state]);

  if (adRemoval || isOverwolf) {
    return <></>;
  }

  return (
    <>
      <Script
        onError={() => {
          console.warn("NitroAds script failed to load");
          setState("error");
        }}
        onReady={() => {
          if (
            "nitroAds" in window &&
            (window.nitroAds as NitroAds).siteId === 1487
          ) {
            console.warn("NitroAds script is ready");
            setState("ready");
          } else {
            console.warn("NitroAds script failed to load");
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
