import { useGameState } from "../game";
import { getGameInfo, listenToGameLaunched, setFeatures } from "./games";
import { ActorPlayer } from "./plugin";

export function listenToGEP(
  gameClassId: number,
  interestedInFeatures: string[],
  gameInfoToPlayer: (gameInfo: any) => ActorPlayer | null
) {
  const state = useGameState.getState();
  const { setPlayer, setError } = state;
  let isActive = false;

  let firstPlayerData = false;
  let lastPlayerError = "";

  async function refreshPlayerState() {
    try {
      const latestGameInfo = await getGameInfo();

      const player = gameInfoToPlayer(latestGameInfo);
      if (!player) {
        setTimeout(refreshPlayerState, 50);
        return;
      }
      if (!firstPlayerData) {
        firstPlayerData = true;
        console.log("Got first data", JSON.stringify(player));
      }
      if (lastPlayerError) {
        lastPlayerError = "";
        setError(null);
      }
      setPlayer(player);

      setTimeout(refreshPlayerState, 50);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (err as string);
      if (errorMessage !== lastPlayerError) {
        lastPlayerError = errorMessage;
        setError(errorMessage);
      }
      setTimeout(refreshPlayerState, 200);
    }
  }

  listenToGameLaunched(() => {
    if (!isActive) {
      isActive = false;
      refreshPlayerState();
      console.log("Game launched -> start updating player position");
    }

    setTimeout(() => setFeatures(interestedInFeatures), 1000);
  }, gameClassId);
}
