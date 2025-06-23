import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "infinity-nikki",
  title: "Infinity Nikki",
  domain: "infinitynikki",
  appUrl: "https://www.overwolf.com/app/leon_machens-infinity_nikki_map",
  withoutLiveMode: true,
  internalLinks: [
    {
      title: "Miraland Map",
      description:
        "Navigate Infinity Nikki's expansive world with our interactive maps.",
      href: "/maps/Miraland",
      iconName: "Map",
      bgImage: "https://data.th.gl/infinity-nikki/map-tiles/1/preview.webp",
      linkText: "Explore the Overworld Map",
    },
    {
      title: "Firework Isles Map",
      description: "Navigate the Firework Isles with our interactive maps.",
      href: "/maps/Firework%20Isles",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/infinity-nikki/map-tiles/10000001/preview.webp",
      linkText: "View the Firework Isles Map",
    },
    {
      title: "Serenity Island Map",
      description: "Navigate the Serenity Island with our interactive maps.",
      href: "/maps/Serenity%20Island",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/infinity-nikki/map-tiles/10000002/preview.webp",
      linkText: "View the Serenity Island Map",
    },
    {
      title: "Sea of Stars Map",
      description: "Navigate the Sea of Stars with our interactive maps.",
      href: "/maps/Sea%20of%20Stars",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/infinity-nikki/map-tiles/14000000/preview.webp",
      linkText: "View the Sea of Stars Map",
    },
  ],
  externalLinks: [],
  keywords: [
    "Whimstar & Whim Balloon spots",
    "Dew of Inspiration & Dew of Firework routes",
  ],
};
