"use client";

import Image from "next/image";
import { trackCustomEvent } from "@repo/ui/header";
import { useState } from "react";
import type { App } from "@/lib/apps";
import { orbitron } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import { Button } from "./button";

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
  const [copied, setCopied] = useState(false);

  if (app.patreonTierIDs && userId) {
    if (hasTier) {
      content = (
        <>
          <a
            className={cn(
              orbitron.className,
              "border rounded border-brand/50 hover:border-brand py-1 px-2 bg-brand/10 hover:bg-brand/20  transition-all uppercase text-sm",
            )}
            href={`${app.overwolf!.protocol}://${
              app.overwolf!.id
            }#userId=${userId}`}
            onClick={() => {
              trackCustomEvent("Supporter: Send Code Click", app.title);
            }}
          >
            Unlock the app
          </a>
          {app.overwolf?.supportsCopySecret ? (
            <>
              <p className="text-muted-foreground my-1">or</p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  setCopied(true);
                  setTimeout(() => {
                    setCopied(false);
                  }, 3000);
                }}
                className=" mx-2"
              >
                {copied ? "Copied" : "Copy Secret"}
              </Button>
            </>
          ) : null}
        </>
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
