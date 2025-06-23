import { useGameState } from "../game";
import { MESSAGES, type EventBus } from "./event-bus";

export async function listenToGameEvents(): Promise<void> {
  const state = useGameState.getState();
  const { setPlayer, setActors, setError, setCharacter } = state;
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
      case MESSAGES.PLAYER:
        setPlayer(value);
        break;
      case MESSAGES.ACTORS:
        setActors(value);
        break;
      case MESSAGES.CHARACTER:
        setCharacter(value);
        break;
    }
  });

  console.log("Listening to game events");
}
