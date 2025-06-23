import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "once-human",
  title: "Once Human",
  domain: "oncehuman",
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Once_Human_Map",
  internalLinks: [
    {
      href: "/",
      title: "Maps",
      description:
        "Navigate Once Human's expansive world with our interactive maps.",
      iconName: "Map",
      linkText: "Explore Maps",
    },
    {
      href: "/mod-locations",
      title: "Mod Locations",
      description: "A comprehensive list of mod locations.",
      iconName: "ArrowUp",
      linkText: "View Mod Locations",
    },
    {
      href: "/deviant-locations",
      title: "Deviant Locations",
      description: "A comprehensive list of deviant locations.",
      iconName: "Bug",
      linkText: "View Deviant Locations",
    },
    {
      href: "/remnants",
      title: "Remnants",
      description: "A comprehensive list of remnants records.",
      iconName: "NotepadText",
      linkText: "View Remnants",
    },
    {
      href: "/regional-records",
      title: "Regional Records",
      description: "All Regional Records Field Guide Entries.",
      iconName: "NotepadText",
      linkText: "View Regional Records",
    },
    {
      href: "/echoes-of-stardust",
      title: "Echoes Of Stardust",
      description: "All Echoes Of Stardust Entries.",
      iconName: "NotepadText",
      linkText: "View Echoes Of Stardust",
    },
    {
      href: "/weapons",
      title: "Weapons",
      description: "All Weapons Entries.",
      iconName: "Axe",
      linkText: "View Weapons",
    },
  ],
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 200,
      zDistance: 3,
    },
  },
};
