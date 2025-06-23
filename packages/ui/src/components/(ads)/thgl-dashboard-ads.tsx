"use client";
import { useEffect } from "react";
import { getNitroAds } from "./nitro-pay";
import { NitroScript } from "./nitro-script";
import { AdFreeContainer } from "./ad-free-container";

const id = "thgl-dashboard";
export function THGLDashboardAds(): JSX.Element {
  return (
    <NitroScript loading={<NitroPayResponsiveLoading id={id} />}>
      <NitroPayResponsive id={id} />
    </NitroScript>
  );
}

function NitroPayResponsive({ id }: { id: string }): JSX.Element {
  useEffect(() => {
    getNitroAds().createAd(id, {
      refreshTime: 30,
      renderVisibleOnly: false,
      sizes: [
        ["300", "250"],
        ["320", "50"],
        ["320", "100"],
        ["336", "280"],
      ],
      report: {
        enabled: true,
        icon: true,
        wording: "Report Ad",
        position: "bottom-right",
      },
      skipBidders: ["google"],
      demo: location.href.includes("localhost"),
      debug: "silent",
    });
  }, []);

  return (
    <AdFreeContainer>
      <div className="w-full shrink-0 min-h-[280]" id={id} />
    </AdFreeContainer>
  );
}

function NitroPayResponsiveLoading({ id }: { id: string }) {
  return (
    <AdFreeContainer>
      <div className="w-full shrink-0" id={id} />
    </AdFreeContainer>
  );
}
