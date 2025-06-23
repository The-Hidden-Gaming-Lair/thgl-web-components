import {
  Actor,
  initBackground,
  initGameEventsPlugin,
} from "@repo/lib/overwolf";
import { fetchVersion } from "@repo/lib";
import { APP_CONFIG } from "./config";

const version = await fetchVersion(APP_CONFIG.name);
const typesIdMap = version.data.typesIdMap;
initGameEventsPlugin(
  {
    onActors: sendActorsToAPI,
  },
  Object.keys(typesIdMap),
);

let lastSend = 0;
let lastActorAddresses: number[] = [];
async function sendActorsToAPI(actors: Actor[]) {
  if (Date.now() - lastSend < 15000) {
    return;
  }
  lastSend = Date.now();
  const newActors = actors.filter(
    (actor) =>
      !lastActorAddresses.includes(actor.address) &&
      actor.type.startsWith("BP_MapObject_"),
  );
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  try {
    await fetch("https://actors-api.th.gl/actors/palworld", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newActors),
    });
  } catch (e) {
    //
  }
}

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
