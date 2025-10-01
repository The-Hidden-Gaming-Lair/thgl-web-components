import { type OverwolfAppConfig } from "@repo/lib";

export const APP_CONFIG: OverwolfAppConfig = {
  name: "diablo4",
  title: "Diablo IV",
  domain: "diablo4",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
  gameClassId: 22700,
  appId: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
  discordApplicationId: "1182968067802812456",
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 10,
      zDistance: 2,
    },
  },
};
