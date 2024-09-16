import {
  type GameEventsPlugin,
  initBackground,
  loadPlugin,
} from "@repo/lib/overwolf";

initBackground(
  23930,
  "hjolmidofgehhbnofcpdbcednenibgnblipabcko",
  "1271431538675814461",
);

async function runPlugin() {
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

  refreshProcess();
}

setTimeout(runPlugin, 1000);
