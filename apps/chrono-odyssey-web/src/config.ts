import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "chrono-odyssey",
  title: "Chrono Odyssey",
  domain: "chronoodyssey",
  appUrl: null,
  internalLinks: [
    {
      href: "/maps/Setera",
      title: "Setera Map",
      description: "Navigate Setera with our interactive maps.",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/chrono-odyssey/map-tiles/setera/preview.webp",
      linkText: "Explore the Setera Map",
    },
  ],
  externalLinks: [],
  keywords: ["Bound Stones", "Resources"],
};
