"use client";

import Image from "next/image";
import { trackCustomEvent } from "@repo/ui/header";
import { useState } from "react";
import { Button } from "@repo/ui/controls";
import { Game } from "@repo/lib";
import { Card } from "@repo/ui/controls";

export function AppSubscriptionCard({
  game,
  userId,
  hasTier,
}: {
  game: Game;
  userId?: string;
  hasTier?: boolean;
}) {
  let content;
  const [copied, setCopied] = useState(false);

  if (hasTier && userId) {
    content = (
      <>
        <Button asChild variant="secondary">
          <a
            href={`${game.overwolf!.protocol}://${
              game.overwolf!.id
            }#userId=${userId}`}
            onClick={() => {
              trackCustomEvent("Supporter: Send Code Click", game.title);
            }}
          >
            Unlock the app
          </a>
        </Button>
        {game.overwolf?.supportsCopySecret ? (
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
              variant="secondary"
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

  return (
    <Card
      key={game.id}
      className="flex flex-col items-center p-4 text-center space-y-2 hover:shadow-lg transition w-64 h-64"
    >
      <div className="space-y-2">
        <Image
          src={game.logo}
          alt={`${game.title} logo`}
          width={64}
          height={64}
          className="mx-auto rounded"
        />
        <h2 className="text-lg font-semibold">{game.overwolf!.title}</h2>
      </div>
      <div>{content}</div>
    </Card>
  );
}
