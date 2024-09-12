import {
  type GameEventsPlugin,
  getRunningGameInfo,
  initBackground,
  loadPlugin,
} from "@repo/lib/overwolf";

initBackground(
  23930,
  "hjolmidofgehhbnofcpdbcednenibgnblipabcko",
  "1271431538675814461",
);

const gameEventsPlugin = await loadPlugin<GameEventsPlugin>("game-events");

const refreshProcess = () => {
  gameEventsPlugin.UpdateProcess(handleCallback, handleError, "ONCE_HUMAN");
};

let status = "";
const handleCallback = () => {
  if (status !== "ok") {
    status = "ok";
    console.log("Game Events Plugin is running");
  }
  setTimeout(refreshProcess, 1000);
};

const handleError = (err: string) => {
  if (err !== status) {
    status = err;
    console.error("Game Events Plugin Error: ", err);
  }
  setTimeout(refreshProcess, 1000);
};

const runningGameInfo = await getRunningGameInfo(23930);
if (runningGameInfo?.isRunning) {
  console.log("Game is already running");
  setTimeout(refreshProcess, 2000);
} else {
  const handleOnGameInfoUpdated = async (
    event: overwolf.games.GameInfoUpdatedEvent,
  ) => {
    if (
      event.runningChanged &&
      event.gameInfo?.classId === 23930 &&
      event.gameInfo.isRunning
    ) {
      console.log("Game is running now");
      setTimeout(refreshProcess, 5000);
      overwolf.games.onGameInfoUpdated.removeListener(handleOnGameInfoUpdated);
    }
  };
  overwolf.games.onGameInfoUpdated.addListener(handleOnGameInfoUpdated);
}
