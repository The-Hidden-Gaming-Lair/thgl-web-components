import { useLiveState } from "./states";

export type RunningGame = {
  exePath: string;
  processName: string;
  pid: number;
};

export function handleRunningGames(
  newRunningGames: Array<RunningGame>,
  onGameStarted: (game: RunningGame) => void,
  onGameClosed: (game: RunningGame) => void,
) {
  const { runningGames, setRunningGames } = useLiveState.getState();
  newRunningGames.forEach((game) => {
    if (!runningGames?.find((g) => g.processName === game.processName)) {
      onGameStarted(game);
    }
  });
  runningGames?.forEach((game) => {
    if (!newRunningGames.find((g) => g.processName === game.processName)) {
      onGameClosed(game);
    }
  });

  setRunningGames(newRunningGames);
}
