"use client";

import { games, Game, DiscordMessageData, localizePath } from "@repo/lib";
import {
  openDesktopWebView,
  openInBrowser,
  showOverlay,
  useLiveState,
  useTHGLAppState,
} from "@repo/lib/thgl-app";
import { useLocale, useT } from "@repo/ui/providers";
import { ScrollArea } from "@repo/ui/controls";
import { DiscordMessage, PreviewImage, Subtitle } from "@repo/ui/content";
import { Badge } from "@repo/ui/controls";
import { Button, Switch, Label } from "@repo/ui/controls";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/controls";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  ExternalLink,
  Monitor,
  Globe,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";

function formatAnchorId(dateStr: string) {
  return dateStr.toLowerCase().replace(/\s+/g, "-");
}

function formatDuration(startedAt: number, endedAt?: number) {
  const end = endedAt ?? Date.now();
  const durationMs = end - startedAt;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GamePageClient({
  game,
  updateMessages,
}: {
  game: Game;
  updateMessages: DiscordMessageData[];
}) {
  const locale = useLocale();
  const t = useT();
  const runningGames = useLiveState((state) => state.runningGames);
  const gameSessions = useTHGLAppState((state) => state.gameSessions);
  const autoRunGames = useTHGLAppState((state) => state.autoRunGames);
  const setAutoRunGame = useTHGLAppState((state) => state.setAutoRunGame);
  const autoRun = autoRunGames[game.id] ?? true;

  const processNames =
    game.companion?.games.flatMap((g) =>
      g.processNames.map((p) => p.toLowerCase()),
    ) ?? [];

  const isRunning = runningGames?.some((rg) =>
    processNames.includes(rg.processName.toLowerCase()),
  );

  // Filter sessions for this game
  const gameSessionsForGame = gameSessions.filter((s) => s.gameId === game.id);

  const connectedClients = useLiveState((state) => state.connectedClients);

  // Check what windows are currently open for this game
  const baseURL = game.companion?.baseURL ?? "";
  const fullBaseURL = baseURL.startsWith("http")
    ? baseURL
    : typeof location !== "undefined"
      ? location.origin + baseURL
      : baseURL;

  const openClients =
    connectedClients?.filter(
      (client) =>
        client.role === "client" && client.href.startsWith(fullBaseURL),
    ) ?? [];

  const hasOverlayOpen = openClients.some((client) =>
    client.href.includes("/overlay"),
  );
  const hasDesktopOpen = openClients.some(
    (client) => !client.href.includes("/overlay"),
  );

  const handleOpenOverlay = () => {
    // C++ handler shows the overlay and updates window mode automatically
    showOverlay();
  };

  const handleOpenDesktop = () => {
    if (!game.companion?.desktopURL) return;
    // C++ handler updates window mode automatically
    openDesktopWebView(
      localizePath(game.companion.desktopURL, locale),
      `${game.title} Desktop`,
    );
  };

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-6 pb-20 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Image
            src={game.logo}
            unoptimized
            alt={game.title}
            width={64}
            height={64}
            className="rounded-lg"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{game.title}</h1>
              {isRunning && (
                <Badge variant="default" className="bg-green-600">
                  {t("game.running")}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {game.companion && (
                <Badge variant="secondary">
                  <Monitor className="h-3 w-3 mr-1" />
                  {t("game.companion")}
                </Badge>
              )}
              {game.web && (
                <Badge variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  {t("game.web")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {game.companion?.overlayURL && (
            <Button
              onClick={handleOpenOverlay}
              disabled={!isRunning}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {t("game.openOverlay")}
            </Button>
          )}

          {game.companion?.desktopURL && (
            <Button
              variant="outline"
              onClick={handleOpenDesktop}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              {t("game.openDesktop")}
            </Button>
          )}

          {game.web && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openInBrowser(game.web!)}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {t("game.openInBrowser")}
            </Button>
          )}
        </div>

        {!isRunning && game.companion?.overlayURL && (
          <p className="text-sm text-muted-foreground">
            {t("game.overlayHint")}
          </p>
        )}

        {!game.companion && game.web && (
          <p className="text-sm text-muted-foreground">
            {t("game.webOnlyHint")}
          </p>
        )}

        {/* Settings - only show for games with companion support */}
        {game.companion && (
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="font-semibold">{t("game.settings")}</h2>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-run">{t("game.autoRun")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("game.autoRunDesc")}
                </p>
              </div>
              <Switch
                id="auto-run"
                checked={autoRun}
                onCheckedChange={(checked) => setAutoRunGame(game.id, checked)}
              />
            </div>
          </div>
        )}

        {/* Session Log - always show for games with companion support */}
        {game.companion && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t("game.sessionLog")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gameSessionsForGame.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("game.noSessions")}
                </p>
              ) : (
                gameSessionsForGame.map((session) => (
                  <div
                    key={session.pid}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {session.status === "connected" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {session.status === "connecting" && (
                        <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
                      )}
                      {session.status === "error" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {session.status === "closed" && (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {session.processName}
                          <span className="text-muted-foreground ml-2 font-normal">
                            PID {session.pid}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTime(session.startedAt)}</span>
                          {session.endedAt && (
                            <>
                              <span>-</span>
                              <span>{formatTime(session.endedAt)}</span>
                            </>
                          )}
                          <span>
                            (
                            {formatDuration(session.startedAt, session.endedAt)}
                            )
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.detectorInitialized ? (
                        <Badge variant="secondary" className="text-xs">
                          {t("game.detectorReady")}
                        </Badge>
                      ) : session.status === "connecting" ? (
                        <Badge variant="outline" className="text-xs">
                          {t("game.initializing")}
                        </Badge>
                      ) : null}
                      {session.lastError && (
                        <Badge variant="destructive" className="text-xs">
                          {session.lastError}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <div className="border-t" />

        {/* Release Notes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("game.releaseNotes")}</h2>
          {updateMessages.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("game.noReleaseNotes")}
            </p>
          ) : (
            <div className="space-y-8">
              {updateMessages.map((updateMessage) => {
                const dateFormatted = new Date(
                  updateMessage.timestamp,
                ).toDateString();
                const anchorId = formatAnchorId(dateFormatted);
                return (
                  <div
                    key={updateMessage.timestamp}
                    id={anchorId}
                    className="scroll-mt-28 space-y-2"
                  >
                    <Subtitle
                      order={3}
                      title={
                        <Link href={`#${anchorId}`} className="hover:underline">
                          {dateFormatted}
                        </Link>
                      }
                    />
                    <DiscordMessage className="text-left space-y-4">
                      {updateMessage.text}
                    </DiscordMessage>
                    {updateMessage.images.length > 0 && (
                      <div className="flex flex-wrap gap-4">
                        {updateMessage.images.map((image) => (
                          <PreviewImage key={image} src={image} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
