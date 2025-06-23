import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "hogwarts-legacy",
  title: "Hogwarts Legacy",
  domain: "hogwarts",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Hogwarts.gg",
  gameClassId: 22600,
  appId: "ejpjngplofkhhplmlfdhlaccobehhefmgbbojdno",
  discordApplicationId: "1262830990053605457",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 350,
    },
  },
};
