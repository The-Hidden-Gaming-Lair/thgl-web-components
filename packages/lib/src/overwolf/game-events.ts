import { useGameState } from "../game";
import type { EventBus } from "./event-bus";

export async function listenToGameEvents(): Promise<void> {
  const state = useGameState.getState();
  const { setPlayer, setActors, setError } = state;
  const { gameEventBus } = overwolf.windows.getMainWindow() as {
    gameEventBus: EventBus;
  };

  gameEventBus.addListener((eventName, eventValue) => {
    const value = JSON.parse(eventValue);
    switch (eventName) {
      case "error":
        {
          const state = useGameState.getState();
          if (state.error !== value) {
            setError(value);
          }
        }
        break;
      case "player":
        setPlayer(value);
        break;
      case "actors":
        setActors(value);
        break;
    }
  });

  console.log("Listening to game events");
}
