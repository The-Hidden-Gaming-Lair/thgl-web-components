import { useSettingsStore } from "../settings";
import { BLACKLISTED_TYPES, isDebug } from "../env";
import { useGameState } from "../game";
import { promisifyOverwolf } from "./promisify";

export async function loadPlugin<T>(name: string): Promise<T> {
  const plugin = await promisifyOverwolf(
    overwolf.extensions.current.getExtraObject,
  )(name);
  return plugin.object as T;
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
    callback: (data: ActorPlayer) => void,
    onError: (err: string) => void,
    processName?: string | null,
  ) => void;
  GetActors: (
    types: string[],
    callback: (data: Actor[]) => void,
    onError: (err: string) => void,
  ) => void;
};

export async function listenToPlugin(
  types: string[],
  pathToMapName?: (path: string) => string | undefined,
  processName?: string,
  normalizeLocation?: (location: {
    x: number;
    y: number;
    mapName?: string;
  }) => void,
) {
  const state = useGameState.getState();
  const { setPlayer, setActors, setError } = state;
  const gameEventsPlugin = await loadPlugin<GameEventsPlugin>("game-events");
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
      console.log("Got first data", JSON.stringify(player));
    }
    if (lastPlayerError) {
      lastPlayerError = "";
      setError(null);
    }
    if (player) {
      if (pathToMapName && player.path) {
        player.mapName = pathToMapName(player.path);
      }
      if (normalizeLocation) {
        normalizeLocation(player);
      }
      if (
        player.x !== prevPlayer.x ||
        player.y !== prevPlayer.y ||
        player.z !== prevPlayer.z ||
        player.r !== prevPlayer.r
      ) {
        prevPlayer = player;
        setPlayer(player);
      }
    }

    setTimeout(refreshPlayerState, 50);
  };
  const handleError = (err: string) => {
    if (err !== lastPlayerError) {
      lastPlayerError = err;
      console.error("Player Error: ", err);
      setError(err);
    }
    setTimeout(refreshPlayerState, 200);
  };

  function refreshPlayerState() {
    if (processName) {
      gameEventsPlugin.GetPlayer(handlePlayer, handleError, processName);
    } else {
      gameEventsPlugin.GetPlayer(handlePlayer, handleError);
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
    const targetTypes = debug ? [] : types;
    gameEventsPlugin.GetActors(
      targetTypes,
      (allActors) => {
        const actors = allActors.filter(
          (a) => !BLACKLISTED_TYPES.includes(a.type),
        );

        if (!firsActorstData && actors.length > 0) {
          firsActorstData = true;
          console.log("Got first actors", actors.length);
        }
        if (lastActorsError) {
          lastActorsError = "";
        }
        actors.forEach((actor) => {
          if (pathToMapName && actor.path) {
            actor.mapName = pathToMapName(actor.path);
          }
          if (normalizeLocation) {
            normalizeLocation(actor);
          }
        });
        setActors(actors);
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
          const closestActors = actors
            .map((actor) => {
              if (pathToMapName && actor.path) {
                actor.mapName = pathToMapName(actor.path);
              }
              if (normalizeLocation) {
                normalizeLocation(actor);
              }

              const dx = actor.x - prevPlayer.x;
              const dy = actor.y - prevPlayer.y;
              const dz = actor.z - prevPlayer.z;
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (pathToMapName && actor.path) {
                actor.mapName = pathToMapName(actor.path);
              }
              const isKnown = types.includes(actor.type);
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
