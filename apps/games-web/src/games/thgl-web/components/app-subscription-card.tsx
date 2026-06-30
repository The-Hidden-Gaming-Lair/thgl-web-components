"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, Card, CardContent } from "@repo/ui/controls";
import { Game } from "@repo/lib";
import { ExternalLink, Copy, Check } from "lucide-react";

export function AppSubscriptionCard({
  game,
  userId,
  hasTier,
}: {
  game: Game;
  userId?: string;
  hasTier?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Card className="flex flex-col w-full max-w-[280px] hover:border-primary transition-colors">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4 h-full">
        {/* Logo and Title */}
        <div className="space-y-3">
          <Image
            src={game.logo}
            unoptimized
            alt={`${game.title} logo`}
            width={64}
            height={64}
            className="mx-auto rounded"
            sizes="64px"
          />
          <h3 className="text-lg font-semibold">{game.overwolf!.title}</h3>
        </div>

        {/* Actions or Message */}
        <div className="grow flex flex-col justify-center gap-3 w-full">
          {hasTier && userId ? (
            <>
              <Button className="w-full" asChild>
                <a
                  href={`${game.overwolf!.protocol}://${
                    game.overwolf!.id
                  }#userId=${userId}`}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Unlock App
                </a>
              </Button>
              {game.overwolf?.supportsCopySecret && (
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(userId);
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                    }, 3000);
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Secret
                    </>
                  )}
                </Button>
              )}
              {game.overwolf?.supportsCopySecret && (
                <p className="text-xs text-muted-foreground">
                  <strong>Unlock App</strong> opens the app directly. If it
                  doesn&apos;t open, use <strong>Copy Secret</strong> and paste
                  it in the app&apos;s account window.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are not subscribed to this app.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
