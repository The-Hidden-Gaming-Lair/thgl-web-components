import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "palia",
  title: "Palia",
  domain: "palia",
  supportedLocales: ["en"],
  appUrl: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
  internalLinks: [
    {
      href: "/maps/Elderwood",
      title: "Elderwood Map",
      description: "Navigate Elderwood with our interactive maps.",
      iconName: "Map",
      bgImage: "https://data.th.gl/palia/map-tiles/AZ2_Root/preview.webp",
      linkText: "Explore the Elderwood Map",
    },
    {
      href: "/maps/Kilima%20Village",
      title: "Kilima Village Map",
      description: "Navigate Kilima Village with our interactive maps.",
      iconName: "Map",
      bgImage: "https://data.th.gl/palia/map-tiles/VillageWorld/preview.webp",
      linkText: "Explore the Kilima Village Map",
    },
    {
      href: "/maps/Bahari%20Bay",
      title: "Bahari Bay Map",
      description: "Navigate Bahari Bay with our interactive maps.",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/palia/map-tiles/AdventureZoneWorld/preview.webp",
      linkText: "Explore the Bahari Bay Map",
    },
    {
      href: "/maps/Fairgrounds",
      title: "Fairgrounds Map",
      description: "Navigate Fairgrounds with our interactive maps.",
      iconName: "Map",
      bgImage: "https://data.th.gl/palia/map-tiles/MajiMarket/preview.webp",
      linkText: "Explore the Fairgrounds Map",
    },
    {
      href: "/rummage-pile",
      title: "Rummage Pile",
      description: "Discover Rummage Pile and Chapaa Pile locations.",
      iconName: "MapPin",
      bgImage: "/rummage-pile.webp",
      linkText: "View Rummage Pile",
    },
    {
      href: "/leaderboard",
      title: "Leaderboard",
      description: "Check out the Palia App Leaderboard.",
      iconName: "Trophy",
      bgImage: "/leaderboard.webp",
      linkText: "View Leaderboard",
    },
    {
      href: "/weekly-wants",
      title: "Weekly Wants",
      description: "Track the Villagers Weekly Wants.",
      iconName: "Gift",
      bgImage: "/weekly-wants.webp",
      linkText: "View Weekly Wants",
    },
  ],
  markerOptions: {
    radius: 6,
    playerIcon: "player.webp",
    imageSprite: true,
    zPos: {
      xyMaxDistance: 15000,
      zDistance: 400,
    },
  },
  keywords: ["Rummage Pile", "Plushies", "Elderwood"],
};
