import {
  Actor,
  createDwellTracker,
  initBackground,
  initGameEventsPlugin,
  sendActorsToAPI as sendActorsToAPIHelper,
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

// Wild-pal sightings are crowd-sourced too, so predicted spawner markers can be
// audited against real in-game spawns (e.g. "does Chillet actually spawn on the
// Frostbound Mountains Summit?"). Scoped to the pal filter groups — owned/companion
// (otomo) pals are already dropped inside the memory-reading plugin, and NPC/visitor
// classes stay out of the crowd data.
const PAL_FILTER_GROUPS = new Set(["pal_common", "pal_alpha", "pal_predator"]);
const palTypeIds = new Set(
  version.data.filters
    .filter((filter) => PAL_FILTER_GROUPS.has(filter.group))
    .flatMap((filter) => filter.values.map((value) => value.id)),
);

let lastSend = 0;
let lastActorAddresses: number[] = [];
// Only report actors that have stayed visible for >= 5s, to drop transient
// memory-read / loading-state blinks that would otherwise become false spawns.
const dwellTracker = createDwellTracker();
async function sendActorsToAPI(actors: Actor[]) {
  // Observe every frame, before the send throttle, so dwell accrues continuously.
  dwellTracker.observe(actors);
  if (Date.now() - lastSend < 15000) {
    return;
  }
  lastSend = Date.now();
  const newActors = actors.filter(
    (actor) =>
      !lastActorAddresses.includes(actor.address) &&
      (actor.type.startsWith("BP_MapObject_") ||
        palTypeIds.has(typesIdMap[actor.type])) &&
      dwellTracker.isStable(actor.address),
  );
  lastActorAddresses = actors.map((actor) => actor.address);
  if (newActors.length === 0) {
    return;
  }
  await sendActorsToAPIHelper("palworld", newActors);
}

await initBackground(
  APP_CONFIG.gameClassId,
  APP_CONFIG.appId,
  APP_CONFIG.discordApplicationId,
);
