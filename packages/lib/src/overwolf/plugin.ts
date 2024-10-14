import { useSettingsStore } from "../settings";
import { BLACKLISTED_TYPES, isDebug } from "../env";
import { promisifyOverwolf } from "./promisify";
import { EventBus, MESSAGES } from "./event-bus";

declare global {
  interface Window {
    gameEventBus: EventBus;
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
};
export type GameEventsPlugin = {
  UpdateProcess: (
    callback: (success: boolean) => void,
    onError: (err: string) => void,
    processName?: string | null,
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
  processName?: string,
  types?: string[],
  actorToMapName?: (actor: Actor, player: ActorPlayer) => string | undefined,
  actorProcessName?: string,
  normalizeLocation?: (location: {
    x: number;
    y: number;
    mapName?: string;
  }) => void,
  filterActor?: (actor: Actor, index: number, actors: Actor[]) => boolean,
  onActors?: (actors: Actor[]) => void | Promise<void>,
  onPlayer?: (player: ActorPlayer | null) => void | Promise<void>,
) {
  try {
    window.gameEventBus = new EventBus();

    const gameEventsPlugin = await loadPlugin<T>("game-events");
    console.log("Game Events Plugin loaded");

    const refreshProcess = () => {
      gameEventsPlugin.UpdateProcess(
        handleRefreshProcessCallback,
        handleRefreshProcessError,
        processName,
      );
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
      setTimeout(refreshProcess, 1000);
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
      if (player && !firstPlayerData) {
        firstPlayerData = true;
        console.log("Got first player", JSON.stringify(player));
      }
      if (lastPlayerError) {
        lastPlayerError = "";
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, null);
      }

      if (player && !Number.isNaN(player.x) && !Number.isNaN(player.y)) {
        if (player.r === null) {
          player.r =
            (Math.atan2(
              player.y - (prevPlayer.y || player.y),
              player.x - (prevPlayer.x || player.x),
            ) *
              180) /
            Math.PI;
        }
        if (actorToMapName && player.path) {
          player.mapName = actorToMapName(player, prevPlayer);
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
      setTimeout(refreshPlayerState, 50);
    };
    const handlePlayerError = (err: string | null) => {
      const errMessage = err || "";
      if (errMessage !== lastPlayerError) {
        lastPlayerError = errMessage;
        console.error("Player Error: ", errMessage);
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

    let liveMode = useSettingsStore.getState().liveMode;
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
          let actors = (allActors || []).filter(
            (a) =>
              !BLACKLISTED_TYPES.includes(a.type) &&
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
          actors.forEach((actor) => {
            if (actorToMapName) {
              actor.mapName = actorToMapName(actor, prevPlayer);
            }
            if (normalizeLocation) {
              normalizeLocation(actor);
            }
          });
          window.gameEventBus.trigger(MESSAGES.ACTORS, actors);
          if (onActors) {
            onActors(actors);
          }
          if (liveMode) {
            setTimeout(refreshActorsState, actorsPollingRate);
          }
        },
        (err) => {
          if (err !== lastActorsError) {
            lastActorsError = err;
            console.error("Actors Error: ", err);
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

    getClosestActors = (filters: string[] = [], limit = 10) => {
      return new Promise((resolve, reject) => {
        gameEventsPlugin.GetActors(
          filters,
          (actors) => {
            const closestActors = (actors || [])
              .map((actor) => {
                if (actorToMapName && actor.path) {
                  actor.mapName = actorToMapName(actor, prevPlayer);
                }
                if (normalizeLocation) {
                  normalizeLocation(actor);
                }

                const dx = actor.x - prevPlayer.x;
                const dy = actor.y - prevPlayer.y;
                const dz = actor.z - prevPlayer.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (actorToMapName && actor.path) {
                  actor.mapName = actorToMapName(actor, prevPlayer);
                }
                const isKnown = types?.includes(actor.type) || false;
                return { ...actor, distance, isKnown };
              })
              .sort((a, b) => a.distance - b.distance)
              .slice(0, limit);
            resolve(closestActors);
          },
          () => {
            reject();
          },
        );
      });
    };
    // @ts-ignore
    window.getClosestActors = getClosestActors;

    return gameEventsPlugin;
  } catch (e) {
    console.error("Error listening to plugin", e);
    throw e;
  }
}

export let getClosestActors:
  | ((
      filters?: string[],
      limit?: number,
    ) => Promise<
      {
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
    >)
  | null = null;
