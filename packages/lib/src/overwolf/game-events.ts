import { useGameState } from "../game";
import type { Actor, ActorPlayer } from "./plugin";
import { MESSAGES, type EventBus } from "./event-bus";

// Match thgl-app/apps.ts: throttle setActors AND skip when nothing about
// the actor set/positions actually changed. Without this, the Overwolf
// plugin's ~100ms poll fires the imperative live-marker subscriber every
// tick even when the player and all NPCs are standing still — wasted CPU
// in Predicted/Combined modes where static markers are already pricey.
const ACTOR_THROTTLE_MS = 200;
let prevActors: Actor[] = [];
let lastActorUpdateTime = 0;
let prevPlayer: ActorPlayer | null = null;

function actorsChanged(prev: Actor[], next: Actor[]): boolean {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (
      a.address !== b.address ||
      a.x !== b.x ||
      a.y !== b.y ||
      a.z !== b.z ||
      a.hidden !== b.hidden
    ) {
      return true;
    }
  }
  return false;
}

export async function listenToGameEvents(): Promise<void> {
  const state = useGameState.getState();
  const { setPlayer, setActors, setError, setCharacter, setDungeonNavmesh } =
    state;
  const { gameEventBus } = overwolf.windows.getMainWindow() as {
    gameEventBus: EventBus;
  };

  gameEventBus.addListener((eventName, eventValue) => {
    const value = eventValue;
    switch (eventName) {
      case MESSAGES.PLAYER_ERROR:
        {
          const state = useGameState.getState();
          if (state.error !== value) {
            setError(value);
          }
        }
        break;
      case MESSAGES.PLAYER: {
        // Skip when nothing about the player actually changed — avoids
        // re-rendering every player-marker / trace-line / audio-alert
        // subscriber every poll while standing still.
        const p = value as ActorPlayer | null;
        if (
          !prevPlayer ||
          !p ||
          p.x !== prevPlayer.x ||
          p.y !== prevPlayer.y ||
          p.z !== prevPlayer.z ||
          (p as any).r !== (prevPlayer as any).r ||
          p.mapName !== prevPlayer.mapName
        ) {
          prevPlayer = p;
          setPlayer(p);
        }
        break;
      }
      case MESSAGES.ACTORS: {
        const now = performance.now();
        const actors = value as Actor[];
        if (
          now - lastActorUpdateTime >= ACTOR_THROTTLE_MS &&
          actorsChanged(prevActors, actors)
        ) {
          prevActors = actors;
          lastActorUpdateTime = now;
          setActors(actors);
        }
        break;
      }
      case MESSAGES.CHARACTER:
        setCharacter(value);
        break;
      case MESSAGES.DUNGEON_NAVMESH:
        // Dungeon floor plan from the plugin poll (background window) -> this window's store,
        // so LiveNavmesh (which reads useGameState here) can render it. null clears it.
        setDungeonNavmesh(value ?? null);
        break;
    }
  });

  console.log("Listening to game events");
}
