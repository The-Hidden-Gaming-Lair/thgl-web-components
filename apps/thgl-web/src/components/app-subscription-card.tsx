"use client";

import Image from "next/image";
import { trackCustomEvent } from "@repo/ui/header";
import type { App } from "@/lib/apps";

export function AppSubscriptionCard({
  app,
  userId,
  hasTier,
}: {
  app: App;
  userId?: string;
  hasTier?: boolean;
}) {
  let content;
  if (app.patreonTierIDs) {
    if (hasTier) {
      content = (
        <a
          className="block mx-auto p-2 uppercase text-white bg-brand/70 hover:bg-brand/80 text-sm text-center transition-colors"
          href={`${app.overwolf!.protocol}://${
            app.overwolf!.id
          }#userId=${userId}`}
          onClick={() => {
            trackCustomEvent("Supporter: Send Code Click", app.title);
          }}
        >
          Link your account
        </a>
      );
    } else {
      content = (
        <p className="m-3 max-w-[30ch] text-sm opacity-50 text-center">
          You are not subscribed to this app.
        </p>
      );
    }
  } else {
    content = (
      <p className="m-3 max-w-[30ch] text-sm opacity-50 text-center">
        Coming soon
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-[#569287] bg-[#0b0a0e] overflow-hidden pb-4">
      <Image
        alt={app.title}
        draggable={false}
        height={198}
        src={app.tileSrc}
        width={258}
      />
      <h3 className="m-3 text-lg font-semibold text-center">{app.title}</h3>
      {content}
    </div>
  );
}
