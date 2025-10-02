export interface Tier {
  id: string;
  title: string;
  price: number;
  perks: Perk["id"][];
  gift?: {
    url: string;
    months: number;
  };
  highlight?: boolean;
  hidden?: boolean;
}

export interface Perk {
  id: string;
  title: string;
}

export const perks: Perk[] = [
  {
    id: "comments",
    title: "Full Comments Access",
  },
  {
    id: "supporter-role",
    title: "Discord Supporter Role",
  },
  {
    id: "ad-free",
    title: "Ad Removal on my Apps*",
  },
  {
    id: "premium-features",
    title: "Premium features**",
  },
  {
    id: "preview-access",
    title: "Preview Release Access***",
  },
];

export const tiers: Tier[] = [
  {
    id: "2304899",
    title: "Aeternum Map",
    price: 0,
    perks: [],
    hidden: true,
  },
  {
    id: "9878731",
    title: "Diablo 4 Map",
    price: 0,
    perks: [],
    hidden: true,
  },
  {
    id: "10151819",
    title: "Palia Map",
    price: 0,
    perks: [],
    hidden: true,
  },
  {
    id: "21470801",
    title: "Enthusiast",
    price: 2,
    perks: ["comments", "supporter-role"],
    gift: { url: "https://www.patreon.com/devleon/redeem/03CDE", months: 3 },
  },
  {
    id: "21470797",
    title: "Elite",
    price: 10,
    perks: [
      "comments",
      "supporter-role",
      "ad-free",
      "premium-features",
      "preview-access",
    ],
    highlight: true,
  },
  {
    id: "21470809",
    title: "Pro",
    price: 5,
    perks: ["comments", "supporter-role", "ad-free", "premium-features"],
  },
  {
    id: "special",
    title: "Special",
    price: 0,
    perks: ["comments", "ad-free", "premium-features", "preview-access"],
    hidden: true,
  },
];
