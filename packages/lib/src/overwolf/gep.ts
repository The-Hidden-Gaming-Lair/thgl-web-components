import { EventBus, MESSAGES } from "./event-bus";
import { getGameInfo, listenToGameLaunched, setFeatures } from "./games";
import { ActorPlayer } from "./plugin";
import { createDetectionTelemetry } from "./telemetry";

declare global {
  interface Window {
    gameEventBus: EventBus;
  }
}

export function listenToGEP(
  gameClassId: number,
  interestedInFeatures: string[],
  // null = no position (menu / loading): counted as a failed read by the telemetry.
  gameInfoToPlayer: (gameInfo: any) => ActorPlayer | null,
  // actors-api game id: report detection health (read success only, no positions).
  telemetryGame?: string,
) {
  window.gameEventBus = new EventBus();
  const telemetry = telemetryGame
    ? createDetectionTelemetry(telemetryGame, gameClassId)
    : null;

  let isActive = false;

  let firstPlayerData = false;
  let lastPlayerError = "";
  let prevPlayer: ActorPlayer | null = null;

  async function refreshPlayerState() {
    try {
      const latestGameInfo = await getGameInfo();

      const player = gameInfoToPlayer(latestGameInfo);
      telemetry?.onPlayerRead(!!player, player?.mapName);
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
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, null);
      }
      if (
        !prevPlayer ||
        player.x !== prevPlayer.x ||
        player.y !== prevPlayer.y ||
        player.z !== prevPlayer.z ||
        player.r !== prevPlayer.r ||
        player.mapName !== prevPlayer.mapName
      ) {
        prevPlayer = player;
        window.gameEventBus.trigger(MESSAGES.PLAYER, player);
      }
      setTimeout(refreshPlayerState, 50);
    } catch (err) {
      telemetry?.onPlayerRead(false);
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : (err as { error?: string; reason?: string }).error ||
              (err as { error?: string; reason?: string }).reason ||
              "Unknown error";
      if (errorMessage !== lastPlayerError) {
        lastPlayerError = errorMessage;
        window.gameEventBus.trigger(MESSAGES.PLAYER_ERROR, errorMessage);
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
