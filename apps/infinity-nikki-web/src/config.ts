import { type AppConfig } from "@repo/lib";

export const APP_CONFIG: AppConfig = {
  name: "infinity-nikki",
  title: "Infinity Nikki",
  domain: "infinitynikki",
  supportedLocales: ["en"],
  appUrl: null,
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
      title: "Danqing Island Map",
      description: "Navigate the Danqing Island with our interactive maps.",
      href: "/maps/Danqing%20Island",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/infinity-nikki/map-tiles/10000010/preview.webp",
      linkText: "View the Danqing Island Map",
    },
    {
      title: "Danqing Realm Map",
      description: "Navigate the Danqing Realm with our interactive maps.",
      href: "/maps/Danqing%20Realm",
      iconName: "Map",
      bgImage:
        "https://data.th.gl/infinity-nikki/map-tiles/10000027/preview.webp",
      linkText: "View the Danqing Realm Map",
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
