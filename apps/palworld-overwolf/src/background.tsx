import { initBackground, initGameEventsPlugin } from "@repo/lib/overwolf";
import typesIdMap from "./coordinates/types_id_map.json" assert { type: "json" };

initBackground(
  23944,
  "ebafpjfhleenmkcmdhlbdchpdalblhiellgfmmbb",
  "1199636411821854730",
);

initGameEventsPlugin({}, Object.keys(typesIdMap));
