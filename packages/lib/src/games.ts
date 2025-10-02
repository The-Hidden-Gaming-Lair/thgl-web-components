import { HOTKEYS } from "./thgl-app/hotkeys";

export const DEFAULT_PATREON_TIER_IDS = [
  "21470801",
  "21470797",
  "21470809",
  "special",
];

export const games: Array<Game> = [
  {
    id: "chrono-odyssey",
    discordId: "chrono-odyssey",
    title: "Chrono Odyssey",
    logo: "https://www.th.gl/global_icons/chrono-odyssey.webp",
    web: "https://chronoodyssey.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "dune-awakening",
    discordId: "dune-awakening",
    title: "Dune Awakening",
    logo: "https://www.th.gl/global_icons/dune.webp",
    lockedWindowComponents: ["DuneDeepDesertGrid", "DuneHeatmaps"],
    additionalFilters: ["DuneDeepDesertGrid", "DuneHeatmaps"],
    additionalTooltip: ["DuneAltitude"],
    companion: {
      baseURL: "/apps/dune-awakening",
      controllerURL: "/apps/dune-awakening/controller",
      desktopURL: "/apps/dune-awakening",
      overlayURL: "/apps/dune-awakening/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 10000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "Dune: Awakening",
          processNames: ["DuneSandbox-Win64-Shipping.exe"],
        },
      ],
      defaultHotkeys: {
        [HOTKEYS.TOGGLE_APP]: "F6",
        [HOTKEYS.TOGGLE_LOCK_APP]: "F9",
        [HOTKEYS.ZOOM_IN_APP]: "F7",
        [HOTKEYS.ZOOM_OUT_APP]: "F8",
        [HOTKEYS.DISCOVER_NODE]: "F10",
        [HOTKEYS.TOGGLE_LIVE_MODE]: "F5",
        [HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN]: "SHIFT+F9",
      },
    },
    web: "https://duneawakening.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "palia",
    discordId: "palia",
    title: "Palia",
    lockedWindowComponents: ["PaliaTime"],
    additionalComponents: ["PaliaGrid"],
    additionalFilters: ["PaliaWeeklyWants", "PaliaTime", "PaliaGridToggle"],
    logo: "https://www.th.gl/global_icons/palia.webp",
    companion: {
      baseURL: "/apps/palia",
      controllerURL: "/apps/palia/controller",
      desktopURL: "/apps/palia",
      overlayURL: "/apps/palia/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 15000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "Palia",
          processNames: [
            "PaliaClient-Win64-Shipping.exe",
            "PaliaClientSteam-Win64-Shipping.exe",
          ],
        },
      ],
      defaultHotkeys: {
        [HOTKEYS.TOGGLE_APP]: "F6",
        [HOTKEYS.TOGGLE_LOCK_APP]: "F9",
        [HOTKEYS.ZOOM_IN_APP]: "F7",
        [HOTKEYS.ZOOM_OUT_APP]: "F8",
        [HOTKEYS.DISCOVER_NODE]: "F10",
        [HOTKEYS.TOGGLE_LIVE_MODE]: "F5",
        [HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN]: "SHIFT+F9",
      },
    },
    web: "https://palia.th.gl",
    overwolf: {
      id: "fgbodfoepckgplklpccjedophlahnjemfdknhfce",
      title: "Palia Map",
      protocol: "thgl-palia-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Palia_Map",
      supportsCopySecret: true,
    },
    patreonTierIDs: ["10151819", ...DEFAULT_PATREON_TIER_IDS],
    partnerApps: [
      {
        id: "palia-tracker",
        title: "Palia Tracker",
        description:
          "Keep track of your daily gifted Palians and weeekly wants.",
        author: "anniebananie",
        web: "https://www.paliatracker.com/",
      },
    ],
  },
  {
    id: "palworld",
    discordId: "palworld",
    title: "Palworld",
    logo: "https://www.th.gl/global_icons/palworld.webp",
    additionalTooltip: ["PalworldCoordinates"],
    companion: {
      baseURL: "/apps/palworld",
      controllerURL: "/apps/palworld/controller",
      desktopURL: "/apps/palworld",
      overlayURL: "/apps/palworld/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 15000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "Palworld",
          processNames: ["Palworld-Win64-Shipping.exe"],
        },
      ],
      defaultHotkeys: {
        [HOTKEYS.TOGGLE_APP]: "F6",
        [HOTKEYS.TOGGLE_LOCK_APP]: "F9",
        [HOTKEYS.ZOOM_IN_APP]: "F7",
        [HOTKEYS.ZOOM_OUT_APP]: "F8",
        [HOTKEYS.DISCOVER_NODE]: "F10",
        [HOTKEYS.TOGGLE_LIVE_MODE]: "F5",
        [HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN]: "SHIFT+F9",
      },
    },
    web: "https://palworld.th.gl",
    overwolf: {
      id: "ebafpjfhleenmkcmdhlbdchpdalblhiellgfmmbb",
      title: "Palworld Interactive Map",
      protocol: "thgl-palworld",
      url: "https://www.overwolf.com/app/Leon_Machens-Palworld-Interactive-map",
      supportsCopySecret: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "once-human",
    discordId: "once-human",
    title: "Once Human",
    additionalFilters: ["PlayerDetails"],
    logo: "https://www.th.gl/global_icons/once-human.webp",
    companion: {
      baseURL: "/apps/once-human",
      controllerURL: "/apps/once-human/controller",
      desktopURL: "/apps/once-human",
      overlayURL: "/apps/once-human/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 200,
          zDistance: 3,
        },
      },
      games: [
        {
          title: "Once Human",
          processNames: ["ONCE_HUMAN.exe", "七日世界.exe"],
        },
      ],
      defaultHotkeys: {
        [HOTKEYS.TOGGLE_APP]: "F6",
        [HOTKEYS.TOGGLE_LOCK_APP]: "F9",
        [HOTKEYS.ZOOM_IN_APP]: "F7",
        [HOTKEYS.ZOOM_OUT_APP]: "F8",
        [HOTKEYS.DISCOVER_NODE]: "F10",
        [HOTKEYS.TOGGLE_LIVE_MODE]: "F5",
        [HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN]: "SHIFT+F9",
      },
    },
    web: "https://oncehuman.th.gl",
    overwolf: {
      id: "hjolmidofgehhbnofcpdbcednenibgnblipabcko",
      title: "Once Human Map",
      protocol: "thgl-once-human",
      url: "https://www.overwolf.com/app/Leon_Machens-Once_Human_Map",
      supportsCopySecret: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "infinity-nikki",
    discordId: "infinity-nikki",
    title: "Infinity Nikki",
    logo: "https://www.th.gl/global_icons/infinity-nikki.webp",
    web: "https://infinitynikki.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "rsdragonwilds",
    discordId: "dragonwilds",
    title: "RuneScape: Dragonwilds",
    logo: "https://www.th.gl/global_icons/rsdragonwilds.webp",
    companion: {
      baseURL: "/apps/rsdragonwilds",
      controllerURL: "/apps/rsdragonwilds/controller",
      desktopURL: "/apps/rsdragonwilds",
      overlayURL: "/apps/rsdragonwilds/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 10000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "RuneScape: Dragonwilds",
          processNames: ["RSDragonwilds-Win64-Shipping.exe"],
        },
      ],
      defaultHotkeys: {
        [HOTKEYS.TOGGLE_APP]: "F6",
        [HOTKEYS.TOGGLE_LOCK_APP]: "F9",
        [HOTKEYS.ZOOM_IN_APP]: "F7",
        [HOTKEYS.ZOOM_OUT_APP]: "F8",
        [HOTKEYS.DISCOVER_NODE]: "F10",
        [HOTKEYS.TOGGLE_LIVE_MODE]: "F5",
        [HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN]: "SHIFT+F9",
      },
    },
    web: "https://dragonwilds.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "avowed",
    discordId: "avowed",
    title: "Avowed",
    logo: "https://www.th.gl/global_icons/avowed.webp",
    web: "https://avowed.th.gl",
    overwolf: {
      id: "dfmnobmlhpkjnodhlabbmihmgocgpklofeklfmod",
      title: "Avowed Interactive Maps",
      protocol: "thgl-avowed-map",
      url: "https://www.overwolf.com/app/leon_machens-avowed_interactive_maps",
      supportsCopySecret: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "satisfactory",
    discordId: "satisfactory",
    title: "Satisfactory",
    logo: "https://www.th.gl/global_icons/satisfactory.webp",
    web: "https://satisfactory.th.gl",
    overwolf: {
      id: "mgpcocpamehmkagnkjcbabcnnhbebclkiekekhmg",
      title: "Satisfactory Map",
      protocol: "thgl-satisfactory-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Satisfactory_Map",
      supportsCopySecret: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "wuthering-waves",
    discordId: "wuthering-waves",
    title: "Wuthering Waves",
    logo: "https://www.th.gl/global_icons/wuthering-waves.webp",
    companion: {
      baseURL: "/apps/wuthering-waves",
      controllerURL: "/apps/wuthering-waves/controller",
      desktopURL: "/apps/wuthering-waves",
      overlayURL: "/apps/wuthering-waves/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 15000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "Wuthering Waves",
          processNames: ["Client-Win64-Shipping.exe"],
        },
      ],
      defaultHotkeys: {
        [HOTKEYS.TOGGLE_APP]: "F6",
        [HOTKEYS.TOGGLE_LOCK_APP]: "F9",
        [HOTKEYS.ZOOM_IN_APP]: "F7",
        [HOTKEYS.ZOOM_OUT_APP]: "F8",
        [HOTKEYS.DISCOVER_NODE]: "F10",
        [HOTKEYS.TOGGLE_LIVE_MODE]: "F5",
        [HOTKEYS.TOGGLE_OVERLAY_FULLSCREEN]: "SHIFT+F9",
      },
    },
    web: "https://wuthering.th.gl",
    overwolf: {
      id: "gjohaodckfkkodlmmmmeifkdkifddegkleppngad",
      title: "Wuthering Waves Map",
      protocol: "thgl-wuthering-waves",
      url: "https://www.overwolf.com/app/Leon_Machens-Wuthering_Waves_Map",
      supportsCopySecret: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "diablo4",
    discordId: "diablo4",
    title: "Diablo IV",
    logo: "https://www.th.gl/global_icons/diablo4.webp",
    web: "https://diablo4.th.gl",
    overwolf: {
      id: "olbbpfjombddiijdbjeeegeclifleaifdeonllfd",
      title: "Diablo 4 Map",
      protocol: "thgl-diablo4-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Diablo_4_Map",
      supportsCopySecret: true,
    },
    patreonTierIDs: ["9878731", ...DEFAULT_PATREON_TIER_IDS],
    partnerApps: [
      {
        id: "diablo4-companion",
        title: "Diablo IV Companion App",
        description:
          "Ingame overlay to help you find your perfect gear affixes.",
        author: "Uthar",
        web: "https://github.com/josdemmers/Diablo4Companion",
      },
    ],
  },
  {
    id: "new-world",
    discordId: "aeternum-map",
    title: "New World",
    logo: "https://www.th.gl/global_icons/aeternum-map.png",
    web: "https://aeternum-map.th.gl",
    overwolf: {
      id: "bemfloapmmjpmdmjfjgegnacdlgeapmkcmcmceei",
      title: "Aeternum Map",
      protocol: "thgl-aeternum-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Aeternum_Map",
    },
    patreonTierIDs: ["2304899", ...DEFAULT_PATREON_TIER_IDS],
    premiumFeatures: [
      "Open Minimized",
      "Open aeternum-map.th.gl on game launch.",
    ],
    partnerApps: [
      {
        id: "new-world-companion",
        title: "New World Companion App",
        description: "Track learned recipes and current trading post prices.",
        author: "Uthar",
        web: "https://github.com/josdemmers/NewWorldCompanion",
      },
    ],
  },
  {
    id: "sons-of-the-forest",
    discordId: "sons-of-the-forest-map",
    title: "Sons Of The Forest",
    logo: "https://www.th.gl/global_icons/sons-of-the-forest.webp",
    web: "https://sotf.th.gl",
    overwolf: {
      id: "kkgfkggfpkmndnadgkegoheijamdjkeagojfbbfn",
      title: "Sons Of The Forest Map",
      protocol: "thgl-sotf-map",
      url: "https://www.overwolf.com/app/Leon_Machens-Sons_Of_The_Forest_Map",
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "pax-dei",
    discordId: "pax-dei",
    title: "Pax Dei",
    logo: "https://www.th.gl/global_icons/pax-dei.webp",
    web: "https://paxdei.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "hogwarts-legacy",
    discordId: "hogwarts-legacy-map",
    title: "Hogwarts Legacy",
    logo: "https://www.th.gl/global_icons/hogwarts-legacy.webp",
    web: "https://hogwarts.th.gl",
    overwolf: {
      id: "ejpjngplofkhhplmlfdhlaccobehhefmgbbojdno",
      title: "Hogwarts Legacy Map",
      protocol: "thgl-hogwarts-legacy",
      url: "https://www.overwolf.com/app/Leon_Machens-Hogwarts.gg",
      supportsCopySecret: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "night-crows",
    discordId: "night-crows",
    title: "Night Crows",
    logo: "https://www.th.gl/global_icons/night-crows.webp",
    web: "https://nightcrows.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "songs-of-conquest",
    discordId: "songs-of-conquest",
    title: "Songs Of Conquest",
    logo: "https://www.th.gl/global_icons/songs-of-conquest.webp",
    web: "https://soc.th.gl",
    overwolf: {
      id: "jjeemjmkdjlmookbecggoebemjieoihjhhkfmmbl",
      title: "Songs Of Conquest",
      protocol: "thgl-soc",
      url: "https://www.overwolf.com/app/Leon_Machens-SoC.gg",
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
];

export type PartnerApp = {
  id: string;
  title: string;
  description?: string;
  author: string;
  web: string;
};

export type AdditionalContent =
  | "PlayerDetails"
  | "PaliaWeeklyWants"
  | "PaliaGrid"
  | "PaliaGridToggle"
  | "PaliaTime"
  | "DuneDeepDesertGrid"
  | "DuneHeatmaps";

export type AdditionalTooltip = "PalworldCoordinates" | "DuneAltitude";

export type Game = {
  id: string;
  discordId: string;
  title: string;
  logo: string;
  lockedWindowComponents?: Array<AdditionalContent>;
  additionalComponents?: Array<AdditionalContent>;
  additionalFilters?: Array<AdditionalContent>;
  additionalTooltip?: Array<AdditionalTooltip>;
  companion?: {
    baseURL: string;
    controllerURL: string;
    desktopURL: string;
    overlayURL?: string;
    markerOptions: {
      radius: number;
      playerIcon?: string;
      imageSprite: boolean;
      zPos: {
        xyMaxDistance: number;
        zDistance: number;
      };
    };
    games: {
      title: string;
      processNames: string[];
    }[];
    defaultHotkeys: Record<string, string>;
  };
  web?: string;
  overwolf?: {
    id: string;
    title: string;
    protocol: string;
    url: string;
    supportsCopySecret?: boolean;
  };
  patreonTierIDs: string[];
  premiumFeatures?: string[];
  partnerApps?: PartnerApp[];
};
