"use client";

import {
  cn,
  FiltersConfig,
  useAccountStore,
  useSettingsStore,
} from "@repo/lib";
import {
  HOTKEYS,
  applyWindowMode,
  setInputPassThrough,
  useOverwolfState,
} from "@repo/lib/overwolf";
import { ReactNode, useEffect, useState, type JSX } from "react";
import { UnlockButton } from "./unlock-button";
import { OverwolfSettingsDialogContent } from "./settings-dialog-content";
import { useCoordinates } from "../(providers)";
import { SendLogs } from "./send-logs";
import {
  Button,
  Label,
  LiveModeControl,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../(controls)";
import { Hotkey } from "./hotkey";
import { AppStatus } from "./app-status";
import { GameSwitcher } from "../(header)/game-switcher";
import {
  DiscordIcon,
  GitHubIcon,
  RedditIcon,
  WindowControlSymbols,
} from "../(header)";
import { CircleUser, ExternalLink, Menu, Settings } from "lucide-react";
import { ExternalAnchor } from "../(header)/external-anchor";
import { Separator } from "../ui/separator";
import { Dialog } from "../ui/dialog";
import { UserDialog } from "../(header)/user-dialog";

export function AppHeader({
  app,
  appName,
  title,
  gameClassId,
  moreSettings,
  filters,
}: {
  app: string;
  /** Canonical game id (games.ts `name`, e.g. "palia"). `app` is the display
   *  TITLE because GameSwitcher matches on `app.title`, but SettingsDialogContent
   *  gates game-specific sections on the lowercase id, so it needs this. */
  appName?: string;
  title?: string;
  gameClassId: number;
  moreSettings?: ReactNode;
  filters: FiltersConfig;
}): JSX.Element {
  const windowInfo = useOverwolfState((state) => state.windowInfo);
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const settingsStore = useSettingsStore();
  const account = useAccountStore();
  const { typesIdMap } = useCoordinates();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isOverlay) {
      setInputPassThrough(settingsStore.lockedWindow);
    }
  }, [isOverlay, settingsStore.lockedWindow]);

  useEffect(() => {
    if (isOverlay && windowInfo?.stateEx === "normal") {
      overwolf.windows.maximize(windowInfo.id);
    }
  }, [isOverlay, windowInfo?.stateEx]);

  if (!windowInfo) {
    return <></>;
  }

  const isMaximized = windowInfo.stateEx === "maximized";

  // Which segment to highlight. `windowMode` is the source of truth; fall back
  // to the legacy boolean for older profiles that haven't resolved a mode yet.
  const activeWindowMode =
    settingsStore.windowMode ??
    (settingsStore.overlayMode === false ? "desktop" : "overlay");
  const windowModeOptions = [
    { value: "overlay" as const, label: "Overlay" },
    { value: "desktop" as const, label: "2nd Screen" },
    { value: "both" as const, label: "Both" },
  ];

  const settingsDialogContent = (
    <OverwolfSettingsDialogContent
      activeApp={appName ?? app}
      gameClassId={gameClassId}
      more={moreSettings}
      filters={filters}
    />
  );

  // Right side: settings + user + burger + window controls
  const windowControlCount = isOverlay ? 1 : 3;
  const rightPx = (windowControlCount + 3) * 32; // settings, user, burger

  return (
    <>
      <WindowControlSymbols />
      {settingsStore.lockedWindow ? (
        <UnlockButton
          gameClassId={gameClassId}
          onClick={settingsStore.toggleLockedWindow}
        />
      ) : (
        <>
          <header
            className="px-2 h-[32px] fixed left-0 right-0 top-0 border-b bg-linear-to-b backdrop-blur-2xl border-neutral-800 bg-zinc-800/30 flex items-center pointer-events-auto z-999999"
            onDoubleClick={() =>
              isOverlay
                ? null
                : isMaximized
                  ? overwolf.windows.restore(windowInfo.id)
                  : overwolf.windows.maximize(windowInfo.id)
            }
            onMouseDown={() => {
              if (!isMaximized) {
                overwolf.windows.dragMove(windowInfo.id);
              }
            }}
          >
            {/* Game switcher */}
            <GameSwitcher activeApp={app} compact />

            {/* Nav controls — always visible */}
            <nav
              className="ml-2 grow flex items-center gap-2 text-sm font-bold overflow-hidden"
              style={{ paddingRight: rightPx }}
            >
              <div
                className="flex items-center gap-2"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Button onClick={settingsStore.toggleLockedWindow} size="xs">
                  Hide Controls
                </Button>

                <Tooltip delayDuration={200} disableHoverableContent>
                  <TooltipTrigger asChild>
                    <div className="flex rounded-md overflow-hidden border border-gray-600">
                      {windowModeOptions.map((option, index) => (
                        <button
                          key={option.value}
                          type="button"
                          className={cn(
                            "px-2 py-0.5 text-xs transition-colors",
                            index > 0 && "border-l border-gray-600",
                            activeWindowMode === option.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                          )}
                          onClick={() => {
                            settingsStore.setWindowMode(option.value);
                            applyWindowMode(gameClassId);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64" side="bottom">
                    <p>
                      <strong>Overlay:</strong> Shows the map on top of the
                      game. Requires the game running with the Overwolf overlay
                      enabled.
                    </p>
                    <p className="mt-1">
                      <strong>2nd Screen:</strong> Opens the map in a separate
                      desktop window.
                    </p>
                    <p className="mt-1">
                      <strong>Both:</strong> Opens the overlay and the desktop
                      window at once.
                    </p>
                  </TooltipContent>
                </Tooltip>

                {typesIdMap && Object.keys(typesIdMap).length > 0 && (
                  <Tooltip delayDuration={200} disableHoverableContent>
                    <TooltipTrigger asChild>
                      <div>
                        <LiveModeControl />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="w-64" side="bottom">
                      <p>
                        The live mode shows the current locations of some nodes
                        on the map in a limited range. Disable it to see the
                        spawn locations instead. Check the filter tooltip for
                        the live mode support.
                      </p>
                      <Label className="flex items-center gap-2 justify-between">
                        Cycle Live Mode
                        <Hotkey
                          name={HOTKEYS.TOGGLE_LIVE_MODE}
                          gameClassId={gameClassId}
                        />
                      </Label>
                    </TooltipContent>
                  </Tooltip>
                )}

                <AppStatus gameClassId={gameClassId} />
              </div>
            </nav>

            {/* Right side buttons */}
            <div
              className="absolute top-0 right-0 h-[32px] flex items-center"
              onDoubleClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Settings — outline style */}
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 mx-0.5"
                onClick={() => setIsSettingsOpen((v) => !v)}
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
              {/* User — outline style */}
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6 mx-0.5"
                onClick={() =>
                  account.setShowUserDialog(!account.showUserDialog)
                }
                title="Account"
              >
                <CircleUser
                  className={cn(
                    "h-3.5 w-3.5",
                    account.userId && "text-primary",
                  )}
                />
              </Button>
              {/* Burger menu */}
              <button
                className="h-full w-[32px] inline-flex items-center justify-center hover:bg-neutral-700"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                title="Menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {/* Window controls */}
              <button
                className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                onClick={() => {
                  overwolf.windows.minimize(windowInfo.id);
                }}
                type="button"
              >
                <svg className="h-full">
                  <use xlinkHref="#window-control_minimize" />
                </svg>
              </button>
              {isOverlay ? null : isMaximized ? (
                <button
                  className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                  onClick={() => {
                    overwolf.windows.restore(windowInfo.id);
                  }}
                  type="button"
                >
                  <svg className="h-full">
                    <use xlinkHref="#window-control_restore" />
                  </svg>
                </button>
              ) : (
                <button
                  className="h-full w-[32px] inline-flex hover:bg-neutral-700"
                  onClick={() => {
                    overwolf.windows.maximize(windowInfo.id);
                  }}
                  type="button"
                >
                  <svg className="h-full">
                    <use xlinkHref="#window-control_maximize" />
                  </svg>
                </button>
              )}
              <button
                className="h-full w-[32px] inline-flex hover:bg-red-600"
                id="close"
                onClick={() => {
                  overwolf.windows.close("background");
                }}
                type="button"
              >
                <svg className="h-full">
                  <use xlinkHref="#window-control_close" />
                </svg>
              </button>
            </div>
          </header>

          {/* Burger menu panel */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-999998"
                onClick={() => setIsMenuOpen(false)}
              />
              <div
                className="fixed top-[32px] right-0 w-64 bg-zinc-900/95 backdrop-blur-xl border-b border-l border-neutral-800 p-3 flex flex-col gap-2 z-999998 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Social links + debug */}
                <div className="flex items-center gap-1">
                  <ExternalAnchor
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-[#6974f3] transition-colors"
                    href="https://th.gl/discord"
                    title="Discord"
                  >
                    <DiscordIcon size={14} />
                  </ExternalAnchor>
                  <ExternalAnchor
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                    href="https://github.com/The-Hidden-Gaming-Lair"
                    title="GitHub"
                  >
                    <GitHubIcon size={14} className="opacity-70" />
                  </ExternalAnchor>
                  <ExternalAnchor
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                    href="https://www.reddit.com/r/TheHiddenGamingLair/"
                    title="Reddit"
                  >
                    <RedditIcon size={14} className="opacity-70" />
                  </ExternalAnchor>
                  <div className="grow" />
                  <SendLogs />
                </div>
                <Separator />
                {/* Legal links */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <ExternalAnchor
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    href="https://www.th.gl/legal-notice"
                  >
                    Legal Notice
                    <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                  </ExternalAnchor>
                  <ExternalAnchor
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    href="https://www.th.gl/privacy-policy"
                  >
                    Privacy Policy
                    <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                  </ExternalAnchor>
                </div>
              </div>
            </>
          )}

          {/* Settings dialog (controlled) */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            {settingsDialogContent}
          </Dialog>

          {/* User dialog */}
          <UserDialog />
        </>
      )}
    </>
  );
}
