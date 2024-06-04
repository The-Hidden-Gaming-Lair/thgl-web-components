import type { Author } from "./authors";
import { AnnieBananie, DevLeon, Uthar } from "./authors";
import type { Game } from "./games";
import {
  Diablo4,
  HogwartsLegacy,
  LeagueOfLegends,
  LostArk,
  NewWorld,
  NightCrows,
  Nightingale,
  OnceHuman,
  Palia,
  Palworld,
  PaxDei,
  SeekersOfSkyveil,
  SongsOfConquest,
  SonsOfTheForest,
  WutheringWaves,
} from "./games";

export interface App {
  id: string;
  title: string;
  description: string;
  author: Author;
  game?: Game;
  url: string;
  tileSrc: string;
  overwolf?: {
    id: string;
    protocol: string;
    url?: string;
  };
  patreonTierIDs?: string[];
  premiumFeatures?: string[];
  isPartnerApp?: boolean;
}

export const apps: App[] = [
  {
    id: "wuthering-waves",
    title: "Wuthering Waves",
    description: "Interactive map",
    author: DevLeon,
    game: WutheringWaves,
    url: "https://wuthering.th.gl",
    tileSrc: "/wuthering.jpg",
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "pax-dei",
    title: "Pax Dei",
    description: "Interactive map",
    author: DevLeon,
    game: PaxDei,
    url: "https://paxdei.th.gl",
    tileSrc: "/pax-dei.jpg",
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "once-human",
    title: "Once Human",
    description: "Interactive map",
    author: DevLeon,
    game: OnceHuman,
    url: "https://oncehuman.th.gl",
    tileSrc: "/once-human.jpg",
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "seekers-of-skyveil",
    title: "Seekers of Skyveil",
    description: "Interactive map",
    author: DevLeon,
    game: SeekersOfSkyveil,
    url: "https://seekers.th.gl",
    tileSrc: "/seekers-of-skyveil.jpg",
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "night-crows",
    title: "Night Crows",
    description: "Interactive map",
    author: DevLeon,
    game: NightCrows,
    url: "https://nightcrows.th.gl",
    tileSrc: "/night-crows.jpg",
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "nightingale",
    title: "Nightingale",
    description: "Interactive map with real-time position tracking",
    author: DevLeon,
    game: Nightingale,
    url: "https://nightingale.th.gl",
    tileSrc: "/nightingale.jpg",
    overwolf: {
      id: "jmdeljpdelieondpjbdoegkbhfokaemhgnmhidef",
      protocol: "thgl-nightingale",
      url: "https://www.overwolf.com/app/Leon_Machens-Nightingale_Map",
    },
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "palworld",
    title: "Palworld",
    description: "Interactive map with real-time position tracking",
    author: DevLeon,
    game: Palworld,
    url: "https://palworld.th.gl",
    tileSrc: "/palworld.jpg",
    overwolf: {
      id: "ebafpjfhleenmkcmdhlbdchpdalblhiellgfmmbb",
      protocol: "thgl-palworld",
      url: "https://www.overwolf.com/app/Leon_Machens-Palworld-Interactive-map",
    },
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "aeternum-map",
    title: "Aeternum Map",
    description: "Interactive map with real-time position tracking",
    author: DevLeon,
    game: NewWorld,
    url: "https://aeternum-map.th.gl",
    tileSrc: "/aeternum-map.jpg",
    overwolf: {
      id: "bemfloapmmjpmdmjfjgegnacdlgeapmkcmcmceei",
      protocol: "thgl-aeternum-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Aeternum_Map",
    },
    patreonTierIDs: ["21470797", "21470809", "2304899", "special"],
    premiumFeatures: [
      "Open Minimized",
      "Open aeternum-map.th.gl on game launch.",
    ],
  },
  {
    id: "aeternum-tracker",
    title: "Aeternum Tracker",
    description: "Personalized Tracking for New World Players",
    author: DevLeon,
    game: NewWorld,
    url: "https://aeternum-tracker.th.gl",
    tileSrc: "/aeternum-tracker.jpg",
  },
  {
    id: "diablo4-map",
    title: "Diablo IV",
    description: "Discover Sancturay with real-time position tracking",
    author: DevLeon,
    game: Diablo4,
    url: "https://diablo4.th.gl",
    tileSrc: "/diablo4.jpg",
    overwolf: {
      id: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
      protocol: "thgl-diablo4-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
    },
    patreonTierIDs: ["21470797", "21470809", "9878731", "special"],
  },
  {
    id: "palia-map",
    title: "Palia Map",
    description: "Interactive map with real-time position tracking",
    author: DevLeon,
    game: Palia,
    url: "https://palia.th.gl",
    tileSrc: "/palia-map.jpg",
    overwolf: {
      id: "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
      protocol: "thgl-palia-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
    },
    patreonTierIDs: ["21470797", "21470809", "10151819", "special"],
  },
  {
    id: "sons-of-the-forest-map",
    title: "Sons Of The Forest Map",
    description: "Real-Time position tracking, nodes and more",
    author: DevLeon,
    game: SonsOfTheForest,
    url: "https://sotf.th.gl",
    tileSrc: "/sotf.jpg",
    overwolf: {
      id: "kkgfkggfpkmndnadgkegoheijamdjkeagojfbbfn",
      protocol: "thgl-sotf-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Sons_Of_The_Forest_Map",
    },
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "arkesia-map",
    title: "Lost Ark Map",
    description: "Interactive map with mokoko seeds, hidden stories and more",
    author: DevLeon,
    game: LostArk,
    url: "https://arkesia.th.gl",
    tileSrc: "/arkesia.jpg",
    overwolf: {
      id: "mgokpapghpdlaakgbcofogjaenoapjknlmfamcio",
      protocol: "thgl-arkesia-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Arkesia.gg",
    },
    patreonTierIDs: ["21470797", "21470809", "9459176", "special"],
  },
  {
    id: "hogwarts-legacy-map",
    title: "Hogwarts Legacy Map",
    description: "Real-time tracking and progress updates",
    author: DevLeon,
    game: HogwartsLegacy,
    url: "https://hogwarts.th.gl",
    tileSrc: "/hogwarts.jpg",
    overwolf: {
      id: "ejpjngplofkhhplmlfdhlaccobehhefmgbbojdno",
      protocol: "thgl-hogwarts-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Hogwarts.gg",
    },
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "songs-of-conquest",
    title: "Songs Of Conquest",
    description:
      "Database with buildings, factions, units, skills, spells and wielders",
    author: DevLeon,
    game: SongsOfConquest,
    url: "https://soc.th.gl",
    tileSrc: "/soc.jpg",
    overwolf: {
      id: "jjeemjmkdjlmookbecggoebemjieoihjhhkfmmbl",
      protocol: "thgl-soc",
      url: "https://www.overwolf.com/app/Leon_Machens-SoC.gg",
    },
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "trophy-hunter",
    title: "Trophy Hunter",
    description:
      "Over 200 trophies to achieve, all with unique abilities and skills",
    author: DevLeon,
    game: LeagueOfLegends,
    url: "https://lol.th.gl",
    tileSrc: "/th.jpg",
    overwolf: {
      id: "hgiobbchekblfkiionmkcedlnhbkpdkekmcnceki",
      protocol: "thgl-lol-th",
      url: "https://www.overwolf.com/app/Leon_Machens-Trophy_Hunter_Reforged",
    },
    patreonTierIDs: ["21470797", "21470809", "special"],
  },
  {
    id: "new-world-influence-updates",
    title: "New World Influence Updates",
    description: "Bring a visual understanding of each server",
    author: DevLeon,
    game: NewWorld,
    url: "https://influence.th.gl/",
    tileSrc: "/nwmap.jpg",
  },
  {
    id: "skeleton",
    title: "Skeleton",
    description: "A simple and lightweight CSS framework",
    author: DevLeon,
    url: "https://github.com/lmachens/skeleton",
    tileSrc: "/skeleton.jpg",
  },
  {
    id: "new-world-companion",
    title: "New World Companion App",
    description:
      "Keep track of your learned recipes and current trading post prices.",
    author: Uthar,
    game: NewWorld,
    url: "https://github.com/josdemmers/NewWorldCompanion",
    tileSrc: "/newworldcompanion.jpg",
    isPartnerApp: true,
  },
  {
    id: "diablo4-companion",
    title: "Diablo IV Companion App",
    description: "Ingame overlay to help you find your perfect gear affixes.",
    author: Uthar,
    game: Diablo4,
    url: "https://github.com/josdemmers/Diablo4Companion",
    tileSrc: "/diablo4companion.jpg",
    isPartnerApp: true,
  },
  {
    id: "palia-tracker",
    title: "Palia Tracker",
    description: "Keep track of your daily gifted Palians and weeekly wants.",
    author: AnnieBananie,
    game: Palia,
    url: "https://www.paliatracker.com/",
    tileSrc: "/palia-tracker.jpg",
    isPartnerApp: true,
  },
];
