import {
  type GameEventsPlugin,
  initBackground,
  loadPlugin,
} from "@repo/lib/overwolf";

initBackground(23626, "gjohaodckfkkodlmmmmeifkdkifddegkleppngad", "xxx");

const gameEventsPlugin = await loadPlugin<GameEventsPlugin>("game-events");

const refreshProcess = () => {
  gameEventsPlugin.UpdateProcess(handleCallback, handleError);
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
