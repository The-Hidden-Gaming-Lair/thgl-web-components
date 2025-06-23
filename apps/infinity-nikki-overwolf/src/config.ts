import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "infinity-nikki",
  title: "Infinity Nikki",
  domain: "infinitynikki",
  appUrl: "https://www.overwolf.com/app/leon_machens-infinity_nikki_map",
  gameClassId: 25272,
  appId: "knchkffjpmpjmbkealfenpjojmjhakdkdfpnpibl",
  discordApplicationId: "1341843888981409873",
  withoutLiveMode: true,
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
};
