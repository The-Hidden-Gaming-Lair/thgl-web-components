import {
  type GameEventsPlugin,
  initBackground,
  loadPlugin,
} from "@repo/lib/overwolf";

initBackground(
  24300,
  "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
  "1249803392822546512",
);

const gameEventsPlugin = await loadPlugin<GameEventsPlugin>("game-events");

const refreshProcess = () => {
  gameEventsPlugin.UpdateProcess(
    handleCallback,
    handleError,
    "Client-Win64-Shipping",
  );
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
