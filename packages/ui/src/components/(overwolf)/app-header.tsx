import { cn, useSettingsStore } from "@repo/lib";
import {
  Brand,
  Header,
  ReleaseNotesLink,
  HeaderSwitch,
  LockWindowButton,
} from "../(header)";
import {
  HOTKEYS,
  setInputPassThrough,
  togglePreferedWindow,
  useOverwolfState,
} from "@repo/lib/overwolf";
import { ReactNode, useEffect } from "react";
import { UnlockButton } from "./unlock-button";
import { OverwolfSettingsDialogContent } from "./settings-dialog-content";
import { useCoordinates } from "../(providers)";
import { SendLogs } from "./send-logs";
import {
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
  Label,
} from "../(controls)";
import { Hotkey } from "./hotkey";

export function AppHeader({
  app,
  title,
  gameClassId,
  moreSettings,
}: {
  app: string;
  title?: string;
  gameClassId: number;
  moreSettings?: ReactNode;
}): JSX.Element {
  const windowInfo = useOverwolfState((state) => state.windowInfo);
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const settingsStore = useSettingsStore();
  const { typesIdMap } = useCoordinates();

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

  return (
    <>
      <svg style={{ display: "none" }} xmlns="http://www.w3.org/2000/svg">
        <symbol id="window-control_close" viewBox="0 0 30 30">
          <line
            fill="none"
            stroke="currentcolor"
            strokeLinecap="round"
            x1="19.5"
            x2="10.5"
            y1="10.5"
            y2="19.5"
          />
          <line
            fill="none"
            stroke="currentcolor"
            strokeLinecap="round"
            x1="10.5"
            x2="19.5"
            y1="10.5"
            y2="19.5"
          />
        </symbol>
        <symbol id="window-control_maximize" viewBox="0 0 30 30">
          <rect
            fill="none"
            height="9"
            stroke="currentcolor"
            width="9"
            x="10.5"
            y="10.5"
          />
        </symbol>
        <symbol id="window-control_restore" viewBox="0 0 30 30">
          <polyline
            fill="none"
            points="13.5 12 13.5 9.5 20.5 9.5 20.5 16.5 18 16.5"
            stroke="currentcolor"
          />
          <rect
            fill="none"
            height="7"
            stroke="currentcolor"
            width="7"
            x="9.5"
            y="13.5"
          />
        </symbol>
        <symbol id="window-control_minimize" viewBox="0 0 30 30">
          <line
            fill="none"
            stroke="currentcolor"
            x1="10"
            x2="20"
            y1="19.5"
            y2="19.5"
          />
        </symbol>
      </svg>
      {isOverlay && settingsStore.lockedWindow ? (
        <UnlockButton
          gameClassId={gameClassId}
          onClick={settingsStore.toggleLockedWindow}
        />
      ) : (
        <Header
          activeApp={app}
          onDoubleClick={() =>
            isOverlay
              ? null
              : isMaximized
                ? overwolf.windows.restore(windowInfo.id)
                : overwolf.windows.maximize(windowInfo.id)
          }
          onMouseDown={() =>
            isMaximized ? null : overwolf.windows.dragMove(windowInfo.id)
          }
          settingsDialogContent={
            <OverwolfSettingsDialogContent
              activeApp={app}
              gameClassId={gameClassId}
              more={moreSettings}
            />
          }
          infoActions={<SendLogs />}
        >
          {isOverlay ? <LockWindowButton /> : null}
          <Brand title={title ?? app} />
          <HoverCard openDelay={50} closeDelay={50}>
            <HoverCardTrigger>
              <HeaderSwitch
                checked={!settingsStore.overlayMode}
                label="2nd Screen Mode"
                onChange={(checked) => {
                  settingsStore.setOverlayMode(!checked);
                  togglePreferedWindow(gameClassId);
                }}
              />
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent className="text-sm">
                <p>
                  Switch between 2nd screen mode and overlay mode. The overlay
                  mode requires that the game is running and it's enabled in the
                  Overwolf overlay settings.
                </p>
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>

          {typesIdMap && (
            <HoverCard openDelay={50} closeDelay={50}>
              <HoverCardTrigger>
                <HeaderSwitch
                  checked={settingsStore.liveMode}
                  label="Live Mode"
                  onChange={settingsStore.toggleLiveMode}
                />
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent className="text-sm">
                  <p>
                    The live mode shows the current locations of some nodes on
                    the map in a limited range. Disable it to see the spawn
                    locations instead. Check the filter tooltip for the live
                    mode support.
                  </p>
                  <Label className="flex items-center gap-2 justify-between">
                    Toggle Live Mode
                    <Hotkey
                      name={HOTKEYS.TOGGLE_LIVE_MODE}
                      gameClassId={gameClassId}
                    />
                  </Label>
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          )}
          <div className="grow" />
          <ReleaseNotesLink
            href={`https://www.th.gl/apps/${app}/release-notes`}
          />
          <div className="w-[80px]" />
          <div className={cn("absolute top-0 right-0 h-[32px]")}>
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
        </Header>
      )}
    </>
  );
}
