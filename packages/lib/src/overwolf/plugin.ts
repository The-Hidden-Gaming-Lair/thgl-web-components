import { useSettingsStore } from "../settings";
import { isDebug } from "../env";
import { promisifyOverwolf } from "./promisify";
import { EventBus, MESSAGES } from "./event-bus";

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

    let status = "";
    const handleRefreshProcessCallback = () => {
      if (status !== "ok") {
        status = "ok";
        console.log("Game Events Process updated");
      }
      setTimeout(refreshProcess, 1000);
    };

    const handleRefreshProcessError = (err: string) => {
      if (err !== status) {
        status = err;
        console.error("Game Events Plugin Error: ", err);
      }
      setTimeout(refreshProcess, 250);
    };
    setTimeout(() => {
      refreshProcess();
    }, 1500);

    let firstPlayerData = false;
    let lastPlayerError = "";
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
        if (lastPlayerError) {
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

    let liveMode = !withoutLiveMode && useSettingsStore.getState().liveMode;
    let actorsPollingRate = useSettingsStore.getState().actorsPollingRate;
    useSettingsStore.subscribe((settings) => {
      if (!liveMode && settings.liveMode) {
        refreshActorsState();
      }
      liveMode = settings.liveMode;
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
