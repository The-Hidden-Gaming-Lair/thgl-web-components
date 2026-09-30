import { isLiveReadingActive, useSettingsStore } from "../settings";
import { isDebug } from "../env";
import { fetchVersion } from "../config";
import { promisifyOverwolf } from "./promisify";
import { EventBus, MESSAGES } from "./event-bus";
import { loadPlugin } from "./plugin";

// Generic live reading for Overwolf apps on the unified THGL plugin
// (thgl-overwolf-plugin, THGLOverwolfPlugin.dll). Like THGLApp, the plugin does all
// per-game work itself — polling, map names, coordinate normalization and the
// crowd-sourced actors-api / game-API reporting — and PUSHES THGLApp-shaped messages
// ({action: "player" | "actors" | "characterData" | "dungeonNavmesh" | "error", payload}).
// This file only forwards them to the window stores and keeps the plugin's settings in
// sync, so an app's background is just:
//   await initTHGLPlugin(APP_CONFIG.name);
//   await initBackground(...);

type THGLPlugin = {
  onMessage: {
    addListener: (listener: (message: string) => void) => void;
    removeListener: (listener: (message: string) => void) => void;
  };
  Start: (
    configJson: string,
    callback: (ok: boolean) => void,
    onError: (err: string) => void,
  ) => void;
  Configure: (
    configJson: string,
    callback: (ok: boolean) => void,
    onError: (err: string) => void,
  ) => void;
  GetClosestActors: (
    optionsJson: string,
    callback: (resultJson: string) => void,
    onError: (err: string) => void,
  ) => void;
};

type PluginMessage = { action: string; payload: any };

function settingsConfig() {
  const settings = useSettingsStore.getState();
  return {
    liveMode: isLiveReadingActive(settings.liveMode),
    actorsPollingRate: settings.actorsPollingRate,
    worldCodeRequestsMuted: Boolean(settings.worldCodeRequestsMuted),
    debug: isDebug(),
  };
}

export async function initTHGLPlugin(appName: string): Promise<THGLPlugin> {
  window.gameEventBus = new EventBus();

  const [version, manifest, plugin] = await Promise.all([
    fetchVersion(appName),
    promisifyOverwolf(overwolf.extensions.current.getManifest)(),
    loadPlugin<THGLPlugin>("game-events"),
  ]);

  // Filter id -> group, for plugin rules keyed on groups (e.g. Palworld pal groups).
  const filterGroups: Record<string, string> = {};
  for (const filter of version.data.filters) {
    for (const value of filter.values) {
      filterGroups[value.id] = filter.group;
    }
  }

  let firstPlayer = false;
  let currentActors = new Map<string, any>();
  plugin.onMessage.addListener((raw) => {
    let message: PluginMessage;
    try {
      message = JSON.parse(raw);
    } catch (e) {
      console.error("THGL plugin: bad message", e);
      return;
    }
    switch (message.action) {
      case "player":
        if (!firstPlayer) {
          firstPlayer = true;
          console.log("Got first player", raw);
        }
        window.gameEventBus.trigger(MESSAGES.PLAYER, message.payload);
        break;
      case "actors":
        // Keyframe: the full set.
        currentActors = new Map(
          (message.payload as any[]).map((a) => [String(a.address), a]),
        );
        window.gameEventBus.trigger(
          MESSAGES.ACTORS,
          Array.from(currentActors.values()),
        );
        break;
      case "actorsDelta": {
        // Only moved/new ({changed}) and gone ({removed}) actors since the last message
        // (THGLApp's actorsDelta). Merged here so every window still receives the full
        // set — a window opened later has no baseline to apply a delta to.
        const { changed = [], removed = [] } = message.payload ?? {};
        for (const address of removed) currentActors.delete(String(address));
        for (const actor of changed)
          currentActors.set(String(actor.address), actor);
        window.gameEventBus.trigger(
          MESSAGES.ACTORS,
          Array.from(currentActors.values()),
        );
        break;
      }
      case "characterData":
        window.gameEventBus.trigger(MESSAGES.CHARACTER, message.payload);
        break;
      case "dungeonNavmesh":
        window.gameEventBus.trigger(MESSAGES.DUNGEON_NAVMESH, message.payload);
        break;
      case "error":
        if (message.payload) {
          console.warn("THGL plugin:", message.payload);
        }
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, message.payload);
        break;
    }
  });

  const config = {
    ...settingsConfig(),
    types: Object.keys(version.data.typesIdMap),
    typesIdMap: version.data.typesIdMap,
    filterGroups,
    appVersion: manifest.meta.version,
  };
  await new Promise<void>((resolve, reject) =>
    plugin.Start(JSON.stringify(config), () => resolve(), reject),
  );
  console.log("THGL plugin started");

  // Keep live mode / polling rate / opt-outs in sync with the user's settings.
  let lastSettings = JSON.stringify(settingsConfig());
  useSettingsStore.subscribe(() => {
    const next = JSON.stringify(settingsConfig());
    if (next === lastSettings) {
      return;
    }
    lastSettings = next;
    plugin.Configure(
      next,
      () => {},
      (err) => console.error("THGL plugin Configure failed", err),
    );
  });

  // Debug "closest actors" tool (send-logs) reads through the main window.
  window.getClosestActors = (filters: string[] = [], limit = 10) =>
    new Promise((resolve) =>
      plugin.GetClosestActors(
        JSON.stringify({ filters, limit }),
        (resultJson) => resolve(JSON.parse(resultJson)),
        (err) =>
          resolve({
            player: null,
            actors: null,
            lastActorsError: err,
          }),
      ),
    );

  return plugin;
}
