import { promisifyOverwolf } from "./promisify";

export async function getRunningGameInfo(gameClassId: number) {
  const runningGameInfo = await promisifyOverwolf(
    overwolf.games.getRunningGameInfo2
  )();
  if (
    !runningGameInfo.gameInfo ||
    runningGameInfo.gameInfo?.classId !== gameClassId
  ) {
    return null;
  }
  return runningGameInfo.gameInfo;
}

export function listenToGameLaunched(
  callback: () => void,
  gameClassId: number
) {
  overwolf.games.onGameInfoUpdated.addListener((res) => {
    if (gameLaunched(res, gameClassId)) {
      callback();
    }
  });

  overwolf.games.getRunningGameInfo((res) => {
    if (gameRunning(res, gameClassId)) {
      callback();
    }
  });
}

export function gameLaunched(
  gameInfoResult: overwolf.games.GameInfoUpdatedEvent,
  gameClassId: number
) {
  if (!gameInfoResult) {
    return false;
  }

  if (!gameInfoResult.gameInfo) {
    return false;
  }

  if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
    return false;
  }

  if (!gameInfoResult.gameInfo.isRunning) {
    return false;
  }

  // NOTE: we divide by 10 to get the game class id without it's sequence number
  if (Math.floor(gameInfoResult.gameInfo.id / 10) != gameClassId) {
    return false;
  }

  return true;
}

export function gameRunning(
  gameInfo: overwolf.games.RunningGameInfo,
  gameClassId: number
) {
  if (!gameInfo) {
    return false;
  }

  if (!gameInfo.isRunning) {
    return false;
  }

  // NOTE: we divide by 10 to get the game class id without it's sequence number
  if (Math.floor(gameInfo.id / 10) != gameClassId) {
    return false;
  }

  return true;
}

export function setFeatures(interestedInFeatures: string[]) {
  overwolf.games.events.setRequiredFeatures(interestedInFeatures, (info) => {
    if (info.error) {
      window.setTimeout(() => setFeatures(interestedInFeatures), 2000);
    } else {
      console.log("Successfully registered to required features.");
    }
  });
}

export function getGameInfo(): Promise<any> {
  return new Promise((resolve, reject) => {
    overwolf.games.events.getInfo((info) => {
      if (info.success) {
        resolve(info.res);
      } else {
        reject(info);
      }
    });
  });
}
