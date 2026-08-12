import { isLiveReadingActive, useSettingsStore } from "../settings";
import { isDebug } from "../env";
import { promisifyOverwolf } from "./promisify";
import { EventBus, MESSAGES } from "./event-bus";
import { type DungeonNavmesh } from "../game";

declare global {
  interface Window {
    gameEventBus: EventBus;
    getClosestActors: (
      filters?: string[],
      limit?: number,
    ) => Promise<{
      player: ActorPlayer | null;
      actors:
        | {
            distance: number;
            isKnown: boolean;
            address: number;
            mapName?: string;
            type: string;
            x: number;
            y: number;
            z: number;
            r: number;
            hidden?: boolean;
            path?: string;
          }[]
        | null;
      lastPlayerError?: string;
      lastActorsError?: string;
    }>;
  }
}

export type ActorPlayer = {
  address: number;
  mapName?: string;
  type: string;
  x: number;
  y: number;
  z: number;
  r: number;
  path?: string;
  props?: Record<string, any>;
  // Per-game world-state tag (Planet Crafter: the live terraform stage id) — the map's
  // terraform-stage selector auto-follows this when present.
  terraformStage?: string;
};
export type Actor = {
  address: number;
  mapName?: string;
  type: string;
  x: number;
  y: number;
  z: number;
  r: number;
  hidden?: boolean;
  path?: string;
  props?: Record<string, any>;
  // Memory reader flagged this actor as already collected (e.g. a picked-up
  // effigy). The frontend permanently marks the node discovered.
  discovered?: boolean;
};
export type GameEventsPlugin = {
  UpdateProcess?: (
    callback: (success: boolean) => void,
    onError: (err: string) => void,
    processName?: string | null,
    moduleNames?: string[] | null,
  ) => void;
  GetPlayer: (
    callback: (data: ActorPlayer | null) => void,
    onError: (err: string) => void,
    processName?: string | null,
  ) => void;
  GetActors: (
    types: string[],
    callback: (data: Actor[] | null) => void,
    onError: (err: string) => void,
  ) => void;
  // Live dungeon floor plan (Palworld). Optional — only games with a dungeon reader implement it.
  GetDungeonFloorPlan?: (
    callback: (data: DungeonNavmesh | null) => void,
    onError: (err: string) => void,
  ) => void;
};

export async function loadPlugin<T>(name: string): Promise<T> {
  console.log("Loading plugin", name);
  const plugin = await promisifyOverwolf(
    overwolf.extensions.current.getExtraObject,
  )(name);
  return plugin.object as T;
}

export async function initGameEventsPlugin<T extends GameEventsPlugin>(
  {
    processName,
    moduleNames,
    onPureActors,
    onActors,
    invertR,
    withoutLiveMode,
  }: {
    processName?: string;
    moduleNames?: string[];
    onPureActors?(actors: Actor[]): void | Promise<void>;
    onActors?(actors: Actor[]): void | Promise<void>;
    invertR?: boolean;
    withoutLiveMode?: boolean;
  },
  types: string[],
  actorToMapName?: (actor: Actor, player: ActorPlayer) => string | undefined,
  actorProcessName?: string,
  normalizeLocation?: (location: {
    x: number;
    y: number;
    mapName?: string;
  }) => void,
  filterActor?: (actor: Actor, index: number, actors: Actor[]) => boolean,
  onPlayer?: (player: ActorPlayer | null) => void | Promise<void>,
) {
  try {
    window.gameEventBus = new EventBus();

    const gameEventsPlugin = await loadPlugin<T>("game-events");
    console.log("Game Events Plugin loaded");

    const refreshProcess = () => {
      if (gameEventsPlugin.UpdateProcess) {
        if (moduleNames) {
          gameEventsPlugin.UpdateProcess(
            handleRefreshProcessCallback,
            handleRefreshProcessError,
            processName,
            moduleNames,
          );
        } else {
          gameEventsPlugin.UpdateProcess(
            handleRefreshProcessCallback,
            handleRefreshProcessError,
            processName,
          );
        }
      }
    };

    let lastPlayerError = "";
    let firstPlayerData = false;

    const handleRefreshProcessCallback = () => {
      if (lastPlayerError) {
        lastPlayerError = "";
        console.log("Game Events Process updated");
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, null);
      }
      setTimeout(refreshProcess, 1000);
    };

    const handleRefreshProcessError = (err: string) => {
      if (err !== lastPlayerError) {
        lastPlayerError = err;
        console.error("Game Events Plugin Error: ", err);
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, err);
      }
      setTimeout(refreshProcess, 250);
    };
    setTimeout(() => {
      refreshProcess();
    }, 1500);

    let prevPlayer: ActorPlayer = {
      address: 0,
      type: "",
      path: "",
      x: 0,
      y: 0,
      z: 0,
      r: 0,
    };

    const handlePlayer = (player: ActorPlayer | null) => {
      try {
        if (lastPlayerError && player) {
          lastPlayerError = "";
          window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, null);
        }

        if (player && !Number.isNaN(player.x) && !Number.isNaN(player.y)) {
          if (player.r === null) {
            if (invertR) {
              player.r =
                (Math.atan2(
                  player.x - (prevPlayer.x || player.x),
                  player.y - (prevPlayer.y || player.y),
                ) *
                  180) /
                Math.PI;
            } else {
              player.r =
                (Math.atan2(
                  player.y - (prevPlayer.y || player.y),
                  player.x - (prevPlayer.x || player.x),
                ) *
                  180) /
                Math.PI;
            }
          }
          if (actorToMapName && player.path) {
            player.mapName = actorToMapName(player, prevPlayer);
            if (!player.mapName) {
              lastPlayerError = "Map name not found";
              throw new Error(lastPlayerError);
            }
          }
          if (player && !firstPlayerData) {
            firstPlayerData = true;
            console.log("Got first player", JSON.stringify(player));
          }

          if (normalizeLocation) {
            normalizeLocation(player);
          }
          if (
            player.x !== prevPlayer.x ||
            player.y !== prevPlayer.y ||
            player.z !== prevPlayer.z ||
            player.r !== prevPlayer.r ||
            player.mapName !== prevPlayer.mapName
          ) {
            if (!Number.isNaN(player.x) && !Number.isNaN(player.y)) {
              prevPlayer = player;
              onPlayer && onPlayer(player);
              window.gameEventBus.trigger(MESSAGES.PLAYER, player);

              if (prevPlayer.mapName !== player.mapName) {
                console.log(`Map changed to ${player.mapName}`);
              }
            }
          }
        } else {
          prevPlayer.mapName = undefined;
        }
      } catch (_) {
        //
      }
      setTimeout(refreshPlayerState, 50);
    };
    const handlePlayerError = (err: string | null) => {
      const errMessage = err || "";
      if (errMessage !== lastPlayerError) {
        lastPlayerError = errMessage;
        console.error("Player Error: ", errMessage);
        firstPlayerData = false;
      }
      window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, errMessage);
      setTimeout(refreshPlayerState, 200);
    };

    function refreshPlayerState() {
      if (actorProcessName) {
        gameEventsPlugin.GetPlayer(
          handlePlayer,
          handlePlayerError,
          actorProcessName,
        );
      } else {
        gameEventsPlugin.GetPlayer(handlePlayer, handlePlayerError);
      }
    }
    refreshPlayerState();

    let liveMode =
      !withoutLiveMode &&
      isLiveReadingActive(useSettingsStore.getState().liveMode);
    let actorsPollingRate = useSettingsStore.getState().actorsPollingRate;
    useSettingsStore.subscribe((settings) => {
      const nextLive =
        !withoutLiveMode && isLiveReadingActive(settings.liveMode);
      if (!liveMode && nextLive) {
        refreshActorsState();
        refreshDungeonFloorPlan();
      }
      liveMode = nextLive;
      actorsPollingRate = settings.actorsPollingRate;
    });

    let firsActorstData = false;
    let lastActorsError = "";
    function refreshActorsState() {
      const debug = isDebug();
      const targetTypes = debug ? [] : types || [];
      gameEventsPlugin.GetActors(
        targetTypes,
        (allActors) => {
          try {
            if (allActors === null) {
              if (liveMode) {
                setTimeout(refreshActorsState, actorsPollingRate);
              }
              return;
            }
            let actors = allActors.filter(
              (a) =>
                !Number.isNaN(a.x) &&
                !Number.isNaN(a.y) &&
                a.address !== prevPlayer.address,
            );

            if (filterActor && !debug) {
              actors = actors.filter(filterActor);
            }

            if (!firsActorstData && actors.length > 0) {
              firsActorstData = true;
              console.log("Got first actors", actors.length);
            }
            if (lastActorsError) {
              lastActorsError = "";
            }
            if (onPureActors) {
              onPureActors(actors);
            }
            actors.forEach((actor) => {
              if (actorToMapName) {
                actor.mapName = actorToMapName(actor, prevPlayer);
                if (!actor.mapName) {
                  throw new Error("Map name not found");
                }
              }
              if (normalizeLocation) {
                normalizeLocation(actor);
              }
            });
            const targetActors =
              targetTypes.length > 0
                ? actors.filter((a) => targetTypes.includes(a.type))
                : actors;
            window.gameEventBus.trigger(MESSAGES.ACTORS, targetActors);

            if (onActors) {
              onActors(actors);
            }
          } catch (_) {
            //
          }
          if (liveMode) {
            setTimeout(refreshActorsState, actorsPollingRate);
          }
        },
        (err) => {
          if (err !== lastActorsError) {
            lastActorsError = err;
            console.error("Actors Error: ", err);
            firsActorstData = false;
          }
          if (liveMode) {
            setTimeout(refreshActorsState, 200);
          }
        },
      );
    }
    if (liveMode) {
      refreshActorsState();
    }

    // Live dungeon floor plan (Palworld): the plugin reads the StaticMeshActor footprint once per
    // dungeon entry and caches it, so a slow poll is enough — it only needs to catch entering/
    // leaving a dungeon and the initial mesh-load. A null result clears the layer (overworld).
    const DUNGEON_FLOOR_MS = 1500;
    let prevFloorKey = "";
    function refreshDungeonFloorPlan() {
      if (!gameEventsPlugin.GetDungeonFloorPlan) {
        return;
      }
      gameEventsPlugin.GetDungeonFloorPlan(
        (plan) => {
          try {
            console.log(
              "[DungeonFloor] plan",
              plan
                ? {
                    mapName: plan.mapName,
                    triangles: plan.triangles,
                    style: plan.style,
                    verts: plan.verts?.length,
                  }
                : null,
            );
            // Dedupe: the plugin caches + returns the same footprint each poll, so only push to
            // the store when it actually changes (enter/exit a dungeon, or the meshes finish
            // streaming). Otherwise the layer would re-bake the silhouette every poll.
            const key = plan ? `${plan.mapName}:${plan.triangles}` : "";
            if (key !== prevFloorKey) {
              prevFloorKey = key;
              // This poll runs in the main/background window; broadcast on the shared bus so the
              // map/overlay window's game-events listener applies it to ITS store (per-window
              // zustand). Calling setDungeonNavmesh here would only update this window's store.
              window.gameEventBus.trigger(MESSAGES.DUNGEON_NAVMESH, plan);
            }
          } catch (e) {
            console.error("[DungeonFloor] handler error", e);
          }
          if (liveMode) setTimeout(refreshDungeonFloorPlan, DUNGEON_FLOOR_MS);
        },
        (err) => {
          console.error("[DungeonFloor] plugin error", err);
          if (liveMode) setTimeout(refreshDungeonFloorPlan, DUNGEON_FLOOR_MS);
        },
      );
    }
    if (liveMode) {
      refreshDungeonFloorPlan();
    }

    _getClosestActors = (filters: string[] = [], limit = 10) => {
      return new Promise((resolve) => {
        gameEventsPlugin.GetPlayer(
          (player) => {
            if (player === null) {
              resolve({
                player: null,
                actors: [],
                lastPlayerError,
                lastActorsError,
              });
              return;
            }
            if (normalizeLocation) {
              normalizeLocation(player);
            }
            gameEventsPlugin.GetActors(
              filters,
              (actors) => {
                const closestActors = (actors || [])
                  .map((actor) => {
                    if (actorToMapName && actor.path) {
                      actor.mapName = actorToMapName(actor, player);
                    }
                    if (normalizeLocation) {
                      normalizeLocation(actor);
                    }

                    const dx = actor.x - player.x;
                    const dy = actor.y - player.y;
                    const dz = actor.z - player.z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (actorToMapName && actor.path) {
                      actor.mapName = actorToMapName(actor, player);
                    }
                    const isKnown = types?.includes(actor.type) || false;
                    return { ...actor, distance, isKnown };
                  })
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, limit);
                resolve({
                  player: player,
                  actors: closestActors,
                  lastPlayerError,
                  lastActorsError,
                });

                resolve({
                  player: prevPlayer,
                  actors: closestActors,
                  lastPlayerError,
                  lastActorsError,
                });
              },
              (error) => {
                resolve({
                  player: null,
                  actors: null,
                  lastPlayerError: undefined,
                  lastActorsError: error,
                });
              },
            );
          },
          (error) => {
            resolve({
              player: null,
              actors: null,
              lastPlayerError: error,
              lastActorsError: undefined,
            });
          },
        );
      });
    };

    return gameEventsPlugin;
  } catch (e) {
    console.error("Error listening to plugin", e);
    throw e;
  }
}
let _getClosestActors: typeof getClosestActors | null = null;

export let getClosestActors: (
  filters?: string[],
  limit?: number,
) => Promise<{
  player: ActorPlayer | null;
  actors:
    | {
        distance: number;
        isKnown: boolean;
        address: number;
        mapName?: string;
        type: string;
        x: number;
        y: number;
        z: number;
        r: number;
        hidden?: boolean;
        path?: string;
      }[]
    | null;
  lastPlayerError?: string;
  lastActorsError?: string;
}> = (filters, limit) => {
  if (_getClosestActors) {
    return _getClosestActors(filters, limit);
  }
  return overwolf.windows.getMainWindow().getClosestActors(filters, limit);
};
window.getClosestActors = getClosestActors;
