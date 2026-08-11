import { isOverwolf, TH_GL_URL } from "./env";
import { HOTKEYS } from "./thgl-app/hotkeys";
import type { MarkerOptions } from "./types";
import type { InGameCoordinates } from "./coordinates";

export const DEFAULT_PATREON_TIER_IDS = [
  "21470801",
  "21470797",
  "21470809",
  "special",
];

export const games: Array<Game> = [
  {
    id: "dragonsword-awakening",
    discordId: "dragonsword-awakening",
    title: "DragonSword: Awakening",
    logo: `${TH_GL_URL}/global_icons/dragonsword-awakening.webp`,
    additionalFilters: ["DragonSwordSaveImport"],
    companion: {
      baseURL: "/apps/dragonsword-awakening",
      controllerURL: "/apps/dragonsword-awakening/controller",
      desktopURL: "/apps/dragonsword-awakening",
      overlayURL: "/apps/dragonsword-awakening/overlay",
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
          title: "DragonSword: Awakening",
          processNames: ["DSClient-Win64-Shipping.exe"],
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
    web: "https://dragonswordawakening.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "crimson-desert",
    discordId: "crimson-desert",
    title: "Crimson Desert",
    logo: `${TH_GL_URL}/global_icons/crimson-desert.webp`,
    additionalFilters: ["CrimsonDesertZones", "CrimsonDesertSaveImport"],
    companion: {
      baseURL: "/apps/crimson-desert",
      controllerURL: "/apps/crimson-desert/controller",
      desktopURL: "/apps/crimson-desert",
      overlayURL: "/apps/crimson-desert/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 100,
          zDistance: 5,
        },
        clusterPrecision: 10,
      },
      games: [
        {
          title: "Crimson Desert",
          processNames: ["CrimsonDesert.exe"],
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
    web: "https://crimsondesert.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "starsand-island",
    discordId: "starsand-island",
    title: "Starsand Island",
    logo: `${TH_GL_URL}/global_icons/starsand-island.webp`,
    companion: {
      baseURL: "/apps/starsand-island",
      controllerURL: "/apps/starsand-island/controller",
      desktopURL: "/apps/starsand-island",
      overlayURL: "/apps/starsand-island/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 100,
          zDistance: 5,
        },
      },
      games: [
        {
          title: "Starsand Island",
          processNames: ["StarsandIsland.exe"],
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
    web: "https://starsandisland.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "soulmask",
    discordId: "soulmask",
    title: "Soulmask",
    logo: `${TH_GL_URL}/global_icons/soulmask.webp`,
    companion: {
      baseURL: "/apps/soulmask",
      controllerURL: "/apps/soulmask/controller",
      desktopURL: "/apps/soulmask",
      overlayURL: "/apps/soulmask/overlay",
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
          title: "Soulmask",
          processNames: ["WS-Win64-Shipping.exe"],
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
    web: "https://soulmask.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "soulframe",
    discordId: "soulframe",
    title: "Soulframe",
    logo: `${TH_GL_URL}/global_icons/soulframe.webp`,
    web: "https://soulframe.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "starrupture",
    discordId: "starrupture",
    title: "Star Rupture",
    logo: `${TH_GL_URL}/global_icons/starrupture.webp`,
    companion: {
      baseURL: "/apps/starrupture",
      controllerURL: "/apps/starrupture/controller",
      desktopURL: "/apps/starrupture",
      overlayURL: "/apps/starrupture/overlay",
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
          title: "Star Rupture",
          processNames: ["StarRuptureGameSteam-Win64-Shipping.exe"],
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
    web: "https://starrupture.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "subnautica-2",
    discordId: "subnautica-2",
    title: "Subnautica 2",
    logo: `${TH_GL_URL}/global_icons/subnautica-2.webp`,
    companion: {
      baseURL: "/apps/subnautica-2",
      controllerURL: "/apps/subnautica-2/controller",
      desktopURL: "/apps/subnautica-2",
      overlayURL: "/apps/subnautica-2/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        // Underwater: large vertical range, so fade markers by depth.
        zPos: {
          xyMaxDistance: 10000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "Subnautica 2",
          processNames: [
            "Subnautica2-Win64-Shipping.exe",
            "Subnautica2-WinGDK-Shipping.exe",
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
    web: "https://subnautica2.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "witchspire",
    discordId: "witchspire",
    title: "Witchspire",
    logo: `${TH_GL_URL}/global_icons/witchspire.webp`,
    companion: {
      baseURL: "/apps/witchspire",
      controllerURL: "/apps/witchspire/controller",
      desktopURL: "/apps/witchspire",
      overlayURL: "/apps/witchspire/overlay",
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
          title: "Witchspire",
          processNames: ["Hercules-Win64-Shipping.exe"],
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
    web: "https://witchspire.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "conan-exiles",
    discordId: "conan-exiles",
    title: "Conan Exiles Enhanced",
    logo: `${TH_GL_URL}/global_icons/conan-exiles.webp`,
    companion: {
      baseURL: "/apps/conan-exiles",
      controllerURL: "/apps/conan-exiles/controller",
      desktopURL: "/apps/conan-exiles",
      overlayURL: "/apps/conan-exiles/overlay",
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
          title: "Conan Exiles Enhanced",
          processNames: ["ConanSandbox-Win64-Shipping.exe"],
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
    web: "https://conanexiles.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "gothic-1-remake",
    discordId: "gothic-1-remake",
    title: "Gothic 1 Remake",
    logo: `${TH_GL_URL}/global_icons/gothic-1-remake.webp`,
    companion: {
      baseURL: "/apps/gothic-1-remake",
      controllerURL: "/apps/gothic-1-remake/controller",
      desktopURL: "/apps/gothic-1-remake",
      overlayURL: "/apps/gothic-1-remake/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 10000,
          zDistance: 400,
        },
        clusterPrecision: 5,
      },
      games: [
        {
          title: "Gothic 1 Remake",
          processNames: ["G1R-Win64-Shipping.exe"],
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
    web: "https://gothic1remake.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "duet-night-abyss",
    discordId: "duet-night-abyss",
    title: "Duet Night Abyss",
    logo: `${TH_GL_URL}/global_icons/duetnightabyss.webp`,
    companion: {
      baseURL: "/apps/duet-night-abyss",
      controllerURL: "/apps/duet-night-abyss/controller",
      desktopURL: "/apps/duet-night-abyss",
      overlayURL: "/apps/duet-night-abyss/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 5000,
          zDistance: 100,
        },
      },
      games: [
        {
          title: "Duet Night Abyss",
          processNames: ["EM-Win64-Shipping.exe"],
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
    web: "https://duetnightabyss.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "blue-protocol-star-resonance",
    discordId: "blue-protocol-star-resonance",
    title: "Blue Protocol: Star Resonance",
    logo: `${TH_GL_URL}/global_icons/starresonance.webp`,
    companion: {
      baseURL: "/apps/blue-protocol-star-resonance",
      controllerURL: "/apps/blue-protocol-star-resonance/controller",
      desktopURL: "/apps/blue-protocol-star-resonance",
      overlayURL: "/apps/blue-protocol-star-resonance/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 100,
          zDistance: 5,
        },
      },
      games: [
        {
          title: "Blue Protocol: Star Resonance",
          processNames: [
            "Star.exe",
            "StarASIA.exe",
            "StarSEA.exe",
            "BPSR_STEAM.exe",
            "BPSR.exe",
            "BPSR_EPIC.exe",
            "StarASIA_STEAM.exe",
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
    web: "https://starresonance.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "chrono-odyssey",
    discordId: "chrono-odyssey",
    title: "Chrono Odyssey",
    logo: `${TH_GL_URL}/global_icons/chrono-odyssey.webp`,
    web: "https://chronoodyssey.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "dune-awakening",
    discordId: "dune-awakening",
    title: "Dune: Awakening",
    logo: `${TH_GL_URL}/global_icons/dune.webp`,
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
    logo: `${TH_GL_URL}/global_icons/palia.webp`,
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
        clusterPrecision: 5,
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
    id: "grounded2",
    discordId: "grounded2",
    title: "Grounded 2",
    logo: `${TH_GL_URL}/global_icons/grounded2.webp`,
    web: "https://grounded2.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "palworld",
    discordId: "palworld",
    title: "Palworld",
    logo: `${TH_GL_URL}/global_icons/palworld.webp`,
    additionalTooltip: ["InGameCoordinates"],
    inGameCoordinates: {
      scale: 459,
      offsetX: -158000,
      offsetY: 123888,
      round: true,
    },
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
          processNames: [
            "Palworld-Win64-Shipping.exe",
            "Palworld-WinGDK-Shipping.exe",
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
    logo: `${TH_GL_URL}/global_icons/once-human.webp`,
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
        coordinateCopyFormat: "({x},{y})",
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
    logo: `${TH_GL_URL}/global_icons/infinity-nikki.webp`,
    web: "https://infinitynikki.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "rsdragonwilds",
    discordId: "rsdragonwilds",
    title: "RuneScape: Dragonwilds",
    logo: `${TH_GL_URL}/global_icons/rsdragonwilds.webp`,
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
    logo: `${TH_GL_URL}/global_icons/avowed.webp`,
    companion: {
      baseURL: "/apps/avowed",
      controllerURL: "/apps/avowed/controller",
      desktopURL: "/apps/avowed",
      overlayURL: "/apps/avowed/overlay",
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
          title: "Avowed",
          processNames: ["Avowed-Win64-Shipping.exe"],
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
    web: "https://avowed.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "satisfactory",
    discordId: "satisfactory",
    title: "Satisfactory",
    logo: `${TH_GL_URL}/global_icons/satisfactory.webp`,
    web: "https://satisfactory.th.gl",
    additionalFilters: ["SatisfactorySeed"],
    companion: {
      baseURL: "/apps/satisfactory",
      controllerURL: "/apps/satisfactory/controller",
      desktopURL: "/apps/satisfactory",
      overlayURL: "/apps/satisfactory/overlay",
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
          title: "Satisfactory",
          processNames: [
            "FactoryGameSteam-Win64-Shipping.exe",
            "FactoryGameEGS-Win64-Shipping.exe",
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
    logo: `${TH_GL_URL}/global_icons/wuthering-waves.webp`,
    additionalTooltip: ["InGameCoordinates"],
    // Map position p = [worldY/100, worldX/100] (extraction), so in-game ≈ map/100.
    inGameCoordinates: { scale: 100, round: true },
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
        clusterPrecision: 50,
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
    id: "neverness-to-everness",
    discordId: "neverness-to-everness",
    title: "Neverness To Everness",
    logo: `${TH_GL_URL}/global_icons/neverness-to-everness.webp`,
    companion: {
      baseURL: "/apps/neverness-to-everness",
      controllerURL: "/apps/neverness-to-everness/controller",
      desktopURL: "/apps/neverness-to-everness",
      overlayURL: "/apps/neverness-to-everness/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 10000,
          zDistance: 1000,
        },
      },
      games: [
        {
          title: "Neverness To Everness",
          processNames: ["HTGame.exe"],
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
    web: "https://nte.th.gl",
    markerOptions: {
      radius: 6,
      playerIcon: "player.webp",
      imageSprite: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "diablo4",
    discordId: "diablo4",
    title: "Diablo IV",
    logo: `${TH_GL_URL}/global_icons/diablo4.webp`,
    web: "https://diablo4.th.gl",
    markerOptions: {
      radius: 6,
      playerIcon: "player.webp",
      imageSprite: true,
      zPos: {
        xyMaxDistance: 10,
        zDistance: 2,
      },
    },
    companion: {
      baseURL: "/apps/diablo4",
      controllerURL: "/apps/diablo4/controller",
      desktopURL: "/apps/diablo4",
      overlayURL: "/apps/diablo4/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 10,
          zDistance: 2,
        },
      },
      games: [
        {
          title: "Diablo IV",
          processNames: ["Diablo IV.exe"],
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
    logo: `${TH_GL_URL}/global_icons/aeternum-map.png`,
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
    logo: `${TH_GL_URL}/global_icons/sons-of-the-forest.webp`,
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
    logo: `${TH_GL_URL}/global_icons/pax-dei.webp`,
    web: "https://paxdei.th.gl",
    markerOptions: {
      radius: 6,
      playerIcon: "player.webp",
      imageSprite: true,
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "hogwarts-legacy",
    discordId: "hogwarts-legacy-map",
    title: "Hogwarts Legacy",
    logo: `${TH_GL_URL}/global_icons/hogwarts-legacy.webp`,
    companion: {
      baseURL: "/apps/hogwarts-legacy",
      controllerURL: "/apps/hogwarts-legacy/controller",
      desktopURL: "/apps/hogwarts-legacy",
      overlayURL: "/apps/hogwarts-legacy/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 15000,
          zDistance: 350,
        },
      },
      games: [
        {
          title: "Hogwarts Legacy",
          processNames: ["HogwartsLegacy.exe"],
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
    web: "https://hogwarts.th.gl",
    markerOptions: {
      radius: 6,
      playerIcon: "player.webp",
      imageSprite: true,
      zPos: {
        xyMaxDistance: 15000,
        zDistance: 350,
      },
    },
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "night-crows",
    discordId: "night-crows",
    title: "Night Crows",
    logo: `${TH_GL_URL}/global_icons/night-crows.webp`,
    web: "https://nightcrows.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "songs-of-conquest",
    discordId: "songs-of-conquest",
    title: "Songs of Conquest",
    logo: `${TH_GL_URL}/global_icons/songs-of-conquest.webp`,
    web: "https://soc.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "heartopia",
    discordId: "heartopia",
    title: "Heartopia",
    logo: `${TH_GL_URL}/global_icons/heartopia.webp`,
    companion: {
      baseURL: "/apps/heartopia",
      controllerURL: "/apps/heartopia/controller",
      desktopURL: "/apps/heartopia",
      overlayURL: "/apps/heartopia/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          xyMaxDistance: 100,
          zDistance: 5,
        },
      },
      games: [
        {
          title: "Heartopia",
          processNames: ["xdt.exe"],
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
    web: "https://heartopia.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "homm-olden-era",
    discordId: "homm-olden-era",
    title: "Heroes of Might & Magic: Olden Era",
    logo: `${TH_GL_URL}/global_icons/homm-olden-era.webp`,
    web: "https://oldenera.th.gl",
    patreonTierIDs: DEFAULT_PATREON_TIER_IDS,
  },
  {
    id: "enshrouded",
    discordId: "enshrouded",
    title: "Enshrouded",
    logo: `${TH_GL_URL}/global_icons/enshrouded.webp`,
    companion: {
      // Live mode still WIP (ECS World pointer) — not announced as supported.
      inDevelopment: true,
      baseURL: "/apps/enshrouded",
      controllerURL: "/apps/enshrouded/controller",
      desktopURL: "/apps/enshrouded",
      overlayURL: "/apps/enshrouded/overlay",
      markerOptions: {
        radius: 6,
        playerIcon: "player.webp",
        imageSprite: true,
        zPos: {
          // Placeholder values — update once sint64→float coordinate scale
          // is confirmed (likely mm→m: divide by 1000) and tested in-game.
          xyMaxDistance: 10000,
          zDistance: 400,
        },
      },
      games: [
        {
          title: "Enshrouded",
          processNames: ["enshrouded.exe"],
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
    web: "https://enshrouded.th.gl",
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
  | "DuneHeatmaps"
  | "CrimsonDesertZones"
  | "CrimsonDesertSaveImport"
  | "DragonSwordSaveImport"
  | "SatisfactorySeed";

export type AdditionalTooltip = "InGameCoordinates" | "DuneAltitude";

export type Game = {
  id: string;
  discordId: string;
  title: string;
  logo: string;
  lockedWindowComponents?: Array<AdditionalContent>;
  additionalComponents?: Array<AdditionalContent>;
  additionalFilters?: Array<AdditionalContent>;
  additionalTooltip?: Array<AdditionalTooltip>;
  /**
   * Per-game map<->in-game coordinate transform. Enables the "In-Game"
   * coordinate tooltip (with `additionalTooltip: ["InGameCoordinates"]`) and the
   * map-controls "Go to coordinate" in-game input toggle.
   */
  inGameCoordinates?: InGameCoordinates;
  /**
   * Canonical marker render options for this game. For companion games these
   * historically live under `companion.markerOptions`; this top-level field is
   * for games that need marker options without a companion block (e.g. diablo4,
   * pax-dei, hogwarts-legacy). Read via `getGameMarkerOptions(game)`, which
   * prefers this field and falls back to `companion.markerOptions`.
   */
  markerOptions?: MarkerOptions;
  companion?: {
    /**
     * Companion integration exists but isn't released yet: excluded from
     * "supported games" lists, counts, and badges (companion-app page, www
     * home, game cards, OG image). Direct routing (/apps/<id>, process
     * detection) stays live so the integration can be tested.
     */
    inDevelopment?: boolean;
    baseURL: string;
    controllerURL: string;
    desktopURL: string;
    overlayURL: string;
    markerOptions: {
      radius: number;
      playerIcon: string;
      imageSprite: boolean;
      zPos: {
        xyMaxDistance: number;
        zDistance: number;
      };
      clusterPrecision?: number;
      coordinateCopyFormat?: string;
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

/**
 * True when the game's companion integration is RELEASED — use for
 * "supported games" lists, counts, and badges. Games with
 * `companion.inDevelopment` keep their routing/config but aren't advertised.
 */
export function hasReleasedCompanion(game: Game): boolean {
  return !!game.companion && !game.companion.inDevelopment;
}

/** The web subdomain for a game (e.g. "starresonance"), derived from `web`. */
export function getAppDomain(game: Game): string {
  return game.web ? new URL(game.web).host.split(".")[0] : game.id;
}

/**
 * Resolve the current game's canonical `Game.id` from the runtime context.
 * Works across all three places we render, and ALWAYS returns the canonical
 * id (not a surface-specific alias) so per-game data keyed by it — community
 * and personal filters, settings — agrees across surfaces:
 *
 *   - Game tenant on the web (paxdei.th.gl, *.localhost): the first subdomain
 *     is the `AppConfig` domain, which differs from `Game.id` for ~17 games
 *     (e.g. `starresonance` → `blue-protocol-star-resonance`). Mapped back to
 *     the canonical id via the registry. Skips infra subdomains (www/app).
 *   - THGLApp WebView (app.th.gl/apps/<id>): the path segment after `/apps/`
 *     is already the `Game.id`.
 *   - Overwolf extension (overwolf-extension://<extId>): hostname is the
 *     extension id; look it up in the registry to recover the canonical id.
 *
 * Returns null when running SSR, on www/app roots, or when no game matches —
 * callers should treat null as "don't render game-scoped UI" rather than
 * guessing.
 */
/**
 * Extract the app id from an in-app route (`/apps/<id>`), tolerating a locale
 * prefix (`/{locale}/apps/<id>` — every locale except the default `en` is
 * prefixed). Keying off a fixed path position broke all non-English languages:
 * they fell back to generic behavior/storage while English got the per-app
 * one, so e.g. settings appeared to change with the selected language.
 */
export function getAppIdFromPathname(pathname: string): string | null {
  const match = pathname.match(
    /^\/(?:[a-z]{2}(?:-[a-zA-Z0-9]{2,4})?\/)?apps\/([^/?#]+)/,
  );
  return match?.[1] ?? null;
}

export function getCurrentGameId(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  const appId = getAppIdFromPathname(path);
  if (appId) return appId;
  if (isOverwolf) {
    const ext = window.location.hostname;
    return games.find((g) => g.overwolf?.id === ext)?.id ?? null;
  }
  let sub = window.location.hostname.split(".")[0];
  if (!sub || ["www", "app", "localhost", "127", "0"].includes(sub))
    return null;
  // Map the tenant subdomain back to the canonical id; fall back to the raw
  // subdomain for web-only games with no registry entry (e.g. drakantos).
  return games.find((g) => getAppDomain(g) === sub)?.id ?? sub;
}
