"use client";

import {
  cn,
  Dict,
  FiltersConfig,
  games,
  GlobalFiltersConfig,
  RegionsConfig,
  THGLAppConfig,
  TilesConfig,
  translate,
  isCompanionPreviewApp,
  isInviteOnlyCompanion,
  isThglApp,
  useAccountGate,
  useAccountStore,
  useCompactOverlay,
  useOverlayMapHidden,
  useSettingsStore,
  Version,
} from "@repo/lib";
import {
  HOTKEYS,
  onWebviewMessage,
  useLiveState,
  setWindowMode as setWindowModeNative,
  WindowMode,
} from "@repo/lib/thgl-app";
import {
  CoordinatesProvider,
  I18NProvider,
  TooltipProvider,
} from "../(providers)";
import {
  Button,
  ErrorBoundary,
  LiveModeControl,
  OverlayMapHiddenPill,
  Toaster,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../(controls)";
import { MarkersSearch } from "../(controls)/markers-search";
import { AppHeader } from "./app-header";
import { PreviewReleaseGate } from "./preview-release-gate";
import { InviteOnlyGate } from "./invite-only-gate";
import { GameBadge } from "../(header)/game-switcher";
import { StatusBanner } from "../(header)/status-banner";
import { ExclusiveFullscreenDialog } from "./exclusive-fullscreen-dialog";
import { OverlayInputEvents } from "./overlay-input-events";
import { AppMapDynamic } from "./app-map-dynamic";
import { CompactOverlay } from "../(desktop)/compact-overlay";
import { InitializeApp } from "./initialize-app";
import { ResizeBorders } from "./resize-borders";
import { EyeNoneIcon, EyeOpenIcon } from "@radix-ui/react-icons";
import { UnlockButton } from "./unlock-button";
import { MapHotkeys } from "./map-hotkeys";
import { DiscordPresenceHintsSender } from "./discord-presence-hints";
import { THGLAppSettingsDialogContent } from "./settings-dialog-content";
import { THGLMapAds } from "../(ads)";
import { AdditionalTooltipType } from "../(content)";
import { MarkerPanel, ZoneDetailsPanel } from "../(data)";
import { ActorTypeFilter } from "./actor-type-filter";
import { isCodexFrame } from "./codex-frame";
import {
  CodexNavigationButtons,
  CodexPane,
  CodexPaneProvider,
  useCodexPane,
} from "./codex-pane";
import { useEffect, useMemo, useState } from "react";
import { setAlertToastOverlay } from "../(controls)/alert-toast";

// Pre-release ("preview") gating lives in @repo/lib: PREVIEW_RELEASE_APPS gates web + companion;
// PREVIEW_RELEASE_COMPANION_APPS gates ONLY the in-game companion (website open). This paywall uses
// isCompanionPreviewApp (either set); the web map/db guard uses isPreviewReleaseApp (full only).

/**
 * The map window (desktop and overlay). The codex pane (codex-pane.tsx) shares
 * its title bar, so its provider wraps the whole window.
 */
export function App(props: React.ComponentProps<typeof AppWindow>) {
  return (
    <CodexPaneProvider>
      <AppWindow {...props} />
    </CodexPaneProvider>
  );
}

function AppWindow({
  appConfig,
  dict,
  filters,
  tiles,
  typesIdMap,
  regions,
  additionalFilters,
  lockedWindowComponents,
  additionalComponents,
  filterBarExtras,
  globalFilters,
  version,
  isOverlay,
  additionalTooltip,
  pagesNav,
}: {
  appConfig: THGLAppConfig;
  dict: Dict;
  tiles: TilesConfig;
  regions: RegionsConfig;
  typesIdMap: Record<string, string>;
  filters: FiltersConfig;
  lockedWindowComponents?: React.ReactNode;
  additionalComponents?: React.ReactNode;
  filterBarExtras?: React.ReactNode;
  globalFilters?: GlobalFiltersConfig;
  additionalFilters?: React.ReactNode;
  version: Version;
  isOverlay?: boolean;
  additionalTooltip?: AdditionalTooltipType;
  /** Database / Guides / Tools tabs (AppPagesNav) for the title bar; they open the codex pane. */
  pagesNav?: React.ReactNode;
}) {
  const lockedWindow = useSettingsStore((state) => state.lockedWindow);
  // Codex pane open: it covers the window below the title bar, and the title
  // bar shows the codex controls instead of the map's.
  const codexPane = useCodexPane();
  const codexOpen = Boolean(pagesNav && codexPane?.open);
  const overlayFullscreen = useSettingsStore(
    (state) => state.overlayFullscreen,
  );
  const fullscreenHotkey = useSettingsStore(
    (state) => state.hotkeys.toggle_overlay_fullscreen,
  );
  const toggleLockedWindow = useSettingsStore(
    (state) => state.toggleLockedWindow,
  );
  const windowMode = useLiveState((state) => state.windowMode);
  const setWindowMode = useLiveState((state) => state.setWindowMode);
  useEffect(() => setAlertToastOverlay(Boolean(isOverlay)), [isOverlay]);
  // A map link opened from the app's codex arrives as /apps/<id>?id=<nodeId>
  // (proxy.ts): select + center that marker like the website's marker URLs.
  const [markerSlug, setMarkerSlug] = useState<string>();
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) setMarkerSlug(id);
    // The map page loaded inside the codex pane (a map redirect the frame's
    // link interceptor could not catch): hand it to the map window instead.
    if (isCodexFrame()) {
      window.parent.postMessage(
        {
          type: "thgl-codex:show-on-map",
          href: window.location.pathname + window.location.search,
        },
        window.location.origin,
      );
    }
  }, []);
  // Per-map overlay auto-hide — the hook must stay mounted even while hidden
  // (it tracks player.mapName and feeds the hotkey override).
  const { hidden: overlayMapHidden } = useOverlayMapHidden();
  // "Widgets Only" overlay (Elite preview, games with `compactOverlay`).
  const compactOverlay = useCompactOverlay(appConfig.name);
  const toggleCompactOverlay = compactOverlay.toggle;
  // Overlay window only: the mode doesn't exist on the desktop window, and a
  // second listener there would toggle the shared setting back.
  useEffect(() => {
    if (!isThglApp || !isOverlay || !compactOverlay.available) return;
    return onWebviewMessage((message) => {
      if (
        message.action === "hotkey" &&
        message.payload.action === HOTKEYS.TOGGLE_COMPACT_OVERLAY
      ) {
        toggleCompactOverlay();
      }
    });
  }, [isOverlay, compactOverlay.available, toggleCompactOverlay]);
  const hasPreviewAccess = useAccountStore(
    (state) => state.perks.previewReleaseAccess,
  );
  const fullTypesIdMap = useMemo(() => {
    if (appConfig.name === "dune-awakening" && hasPreviewAccess) {
      return {
        ...typesIdMap,
      };
    }
    return typesIdMap;
  }, [appConfig.name, hasPreviewAccess, typesIdMap]);
  const withoutLiveMode = useMemo(
    () => Object.keys(fullTypesIdMap).length === 0,
    [fullTypesIdMap],
  );

  // Elite Supporter preview gate for preview-only games without Preview Release
  // Access: the full app shell + header stay (window mode, live mode, settings,
  // window controls) — only the map CONTENT below is covered by the upsell.
  //
  // ⚠️ Both locks resolve through `useAccountGate`, which stays "pending" during
  // SSR *and* the first client render. Do NOT go back to reading `isLocalDev` /
  // `isDebug()` / the persisted perk directly here: they only exist in the
  // browser, so the server rendered them as false → LOCKED, baked the upsell
  // card into the server HTML, and the THGLApp WebView painted it for ~300 ms
  // before hydration unlocked it — a visible flash plus "Hydration failed
  // because the server rendered HTML didn't match the client", which makes
  // React re-render the whole map subtree. "pending" must render the UNLOCKED
  // (neutral) state, never the lock.
  //
  // Deliberate trade-off: a locked user therefore sees the map for the frame
  // between hydration and the account resolving, instead of the paywall being
  // there instantly. That is acceptable HERE — unlike the web guard, this
  // paywall is by design a translucent overlay ON TOP of a fully rendered app
  // (see preview-release-gate.tsx), so the map is rendered underneath either
  // way. Rendering the lock while "pending" is the only alternative, and it is
  // exactly the bug above.
  const invites = useAccountStore((state) => state.invites);
  const previewGate = useAccountGate(hasPreviewAccess);
  const inviteGate = useAccountGate(invites.includes(appConfig.name));
  const isPreviewLocked =
    isCompanionPreviewApp(appConfig.name) && previewGate === "deny";
  // Invite-only companion (games.ts `companion.inviteOnly`, e.g. Pax Dei):
  // locked unless the server-resolved account invites include this game.
  const inviteOnlyGame = useMemo(
    () => games.find((game) => game.id === appConfig.name),
    [appConfig.name],
  );
  const isInviteLocked =
    !!inviteOnlyGame &&
    isInviteOnlyCompanion(inviteOnlyGame) &&
    inviteGate === "deny";

  return (
    <div
      className={cn(
        "font-sans min-h-dscreen text-white antialiased select-none overflow-hidden w-full",
        !isOverlay ? "bg-black" : "bg-transparent",
        {
          locked: isOverlay && lockedWindow,
        },
      )}
    >
      <InitializeApp />
      <I18NProvider dict={dict}>
        <TooltipProvider>
          <CoordinatesProvider
            appName={appConfig.name}
            filters={filters}
            mapNames={Object.keys(tiles)}
            tilesConfig={tiles}
            regions={regions}
            typesIdMap={fullTypesIdMap}
            globalFilters={globalFilters}
            useCbor
            nodesPaths={version.more.nodes}
            staticDrawings={version.data.drawings}
            clusterPrecision={appConfig.markerOptions.clusterPrecision}
            inGameCoordinates={
              games.find((g) => g.id === appConfig.name)?.inGameCoordinates
            }
          >
            {/* Inside CoordinatesProvider: reads the user's enabled filters so the
                native reader only scans/serializes the types actually in use. */}
            <ActorTypeFilter
              appName={appConfig.name}
              typesIdMap={fullTypesIdMap}
            />
            {lockedWindow ? (
              <UnlockButton
                onClick={toggleLockedWindow}
                fullscreenHotkey={
                  isOverlay && overlayFullscreen ? fullscreenHotkey : undefined
                }
              />
            ) : (
              <AppHeader
                isOverlay={isOverlay}
                title={<GameBadge activeApp={appConfig.title} />}
                className={codexOpen ? "bg-zinc-950" : undefined}
                settingsDialogContent={
                  <THGLAppSettingsDialogContent
                    appConfig={appConfig}
                    filters={filters}
                  />
                }
              >
                {codexOpen ? (
                  <>
                    <CodexNavigationButtons />
                    {pagesNav}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={toggleLockedWindow}
                      size="xs"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {lockedWindow ? <EyeOpenIcon /> : <EyeNoneIcon />}
                      <span className="ml-1 hidden md:block">
                        Hide Controls
                      </span>
                    </Button>

                    <Tooltip delayDuration={200} disableHoverableContent>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <div className="flex rounded-md overflow-hidden border border-gray-600">
                            <button
                              className={cn(
                                "px-2 py-0.5 text-xs transition-colors",
                                windowMode === "overlay"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                              )}
                              onClick={() => {
                                setWindowMode("overlay");
                                setWindowModeNative("overlay").catch(
                                  console.error,
                                );
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              disabled={appConfig.withoutOverlayMode}
                            >
                              Overlay
                            </button>
                            <button
                              className={cn(
                                "px-2 py-0.5 text-xs transition-colors border-x border-gray-600",
                                windowMode === "desktop"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                              )}
                              onClick={() => {
                                setWindowMode("desktop");
                                setWindowModeNative("desktop").catch(
                                  console.error,
                                );
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              Desktop
                            </button>
                            <button
                              className={cn(
                                "px-2 py-0.5 text-xs transition-colors",
                                windowMode === "both"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                              )}
                              onClick={() => {
                                setWindowMode("both");
                                setWindowModeNative("both").catch(
                                  console.error,
                                );
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              disabled={appConfig.withoutOverlayMode}
                            >
                              Both
                            </button>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-64" side="bottom">
                        <p>
                          <strong>Overlay:</strong> Shows map overlay on top of
                          the game.
                        </p>
                        <p className="mt-1">
                          <strong>Desktop:</strong> Opens in a separate window
                          (2nd screen).
                        </p>
                        <p className="mt-1">
                          <strong>Both:</strong> Opens both overlay and desktop
                          window.
                        </p>
                        {appConfig.withoutOverlayMode && (
                          <p className="text-red-500 mt-1">
                            The overlay mode is not supported for this game.
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip delayDuration={200} disableHoverableContent>
                      <TooltipTrigger asChild>
                        <div>
                          <LiveModeControl disabled={withoutLiveMode} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="w-64" side="bottom">
                        <p>
                          The live mode shows the current locations of some
                          nodes on the map in a limited range. Disable it to see
                          the spawn locations instead. Check the filter tooltip
                          for the live mode support.
                        </p>
                        {withoutLiveMode && (
                          <p className="text-red-500">
                            The live mode is not supported for this game.
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    {pagesNav}
                  </>
                )}
              </AppHeader>
            )}
            {/* Companion-app webview surface — the 2026-07-27 outage hit
                exactly these users with zero in-app signal. Overlaid below
                the 32px header so the map never shifts; suppressed in
                overlay mode (screen real estate over the game). */}
            {!isOverlay && !lockedWindow && (
              // z-600: above the map controls (filters/actions are z-500)
              // which otherwise paint over the banner (later in DOM).
              <div className="absolute top-[32px] inset-x-0 z-600">
                <StatusBanner game={appConfig.name} surface="thgl-app" />
              </div>
            )}
            <div
              className={cn("relative h-dscreen lock", {
                "pt-[32px]": !Boolean(isOverlay) && !lockedWindow,
              })}
            >
              <ErrorBoundary>
                {isOverlay && overlayMapHidden ? (
                  <OverlayMapHiddenPill />
                ) : isOverlay && compactOverlay.active ? (
                  <>
                    <CompactOverlay
                      widgets={compactOverlay.widgets}
                      onShowMap={compactOverlay.toggle}
                    />
                    {/* Drivers like Palia's world-code request toast keep
                        running; map-bound ones no-op without a map. */}
                    {additionalComponents}
                  </>
                ) : (
                  <>
                    <AppMapDynamic
                      appConfig={appConfig}
                      version={version}
                      isOverlay={Boolean(isOverlay)}
                      tileOptions={tiles}
                      lockedWindow={lockedWindow}
                      additionalTooltip={additionalTooltip}
                      withoutLiveMode={withoutLiveMode}
                      compactOverlay={
                        isOverlay && compactOverlay.offered
                          ? {
                              locked: compactOverlay.locked,
                              preview: compactOverlay.preview,
                              onToggle: compactOverlay.toggle,
                            }
                          : undefined
                      }
                    />
                    {!lockedWindow && (
                      <MarkersSearch
                        lastMapUpdate={version.createdAt}
                        tileOptions={tiles}
                        appName={appConfig.name}
                        additionalFilters={additionalFilters}
                        iconsPath={version?.more.icons}
                        className="top-[40px] md:ml-0"
                        filterBarExtras={filterBarExtras}
                        mapEnTitles={Object.fromEntries(
                          Object.keys(tiles).map((k) => [
                            k,
                            translate(dict, k),
                          ]),
                        )}
                      />
                    )}
                    {lockedWindow ? lockedWindowComponents : null}
                    {additionalComponents}
                    {!lockedWindow && (
                      <>
                        <MarkerPanel
                          appName={appConfig.name}
                          markerSlug={markerSlug}
                          additionalTooltip={additionalTooltip}
                          coordinateCopyFormat={
                            appConfig.markerOptions.coordinateCopyFormat
                          }
                          headerOffset="32px"
                        />
                        <ZoneDetailsPanel appName={appConfig.name} />
                      </>
                    )}
                  </>
                )}
              </ErrorBoundary>
              {/* Codex / guides / tools from the title-bar tabs, over the map
                  (the map stays mounted). "Hide Controls" closes it. */}
              {pagesNav && (
                <CodexPane
                  tiles={tiles}
                  disabled={lockedWindow}
                  onSelectMarker={setMarkerSlug}
                />
              )}
            </div>
            {/* Elite Supporter paywall over the full app — non-modal so the
                header, hotkeys and the window-unlock button stay functional. */}
            {isPreviewLocked && (
              <PreviewReleaseGate
                title={appConfig.title}
                isOverlay={Boolean(isOverlay)}
              />
            )}
            {isInviteLocked && !isPreviewLocked && (
              <InviteOnlyGate
                title={appConfig.title}
                isOverlay={Boolean(isOverlay)}
              />
            )}
            <MapHotkeys tilesConfig={tiles} />
            <DiscordPresenceHintsSender
              appName={appConfig.name}
              filters={filters}
            />
            {isOverlay && <OverlayInputEvents />}
            {isOverlay && <ExclusiveFullscreenDialog />}
          </CoordinatesProvider>
        </TooltipProvider>
      </I18NProvider>
      {!isOverlay && <ResizeBorders />}
      <THGLMapAds isOverlay={isOverlay} appConfig={appConfig} />
      <Toaster />
    </div>
  );
}
