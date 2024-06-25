import type { MarkerOptions, TileOptions } from "./types";

const TILE_SIZE = 512;
const MAP_BOUNDS_A = [
  [-102400, -102400],
  [102400, 102400],
] as [[number, number], [number, number]];
const MAP_BOUNDS_B = [
  [-128000, -128000],
  [128000, 128000],
] as [[number, number], [number, number]];

function getTransformation(mapBounds: [[number, number], [number, number]]) {
  const realSize = mapBounds[1][0] - mapBounds[0][0];
  const multiple = realSize / TILE_SIZE;
  const OFFSET = [-mapBounds[0][1] / multiple, mapBounds[1][0] / multiple];
  return [1 / multiple, OFFSET[0], -1 / multiple, OFFSET[1]] as [
    number,
    number,
    number,
    number,
  ];
}

const TILE_A = {
  minZoom: 0,
  maxZoom: 5,
  fitBounds: MAP_BOUNDS_A,
  transformation: getTransformation(MAP_BOUNDS_A),
};
const TILE_B = {
  minZoom: 0,
  maxZoom: 5,
  fitBounds: MAP_BOUNDS_B,
  transformation: getTransformation(MAP_BOUNDS_B),
};

export const NIGHTINGALE: {
  markerOptions: MarkerOptions;
  tileOptions: TileOptions;
} = {
  markerOptions: {
    radius: 6,
    playerZoom: 4,
    playerIcon: "player.webp",
  },
  tileOptions: {
    // Forest Byway Realm
    MTR_FRT_9812: {
      url: "/map-tiles/MTR_FRT_9812/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Desert Byway Realm
    MTR_DES_8470: {
      url: "/map-tiles/MTR_DES_8470/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Swamp Byway Realm
    MTR_SWP_2221: {
      url: "/map-tiles/MTR_SWP_2221/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Abeyance Forest Realm
    MTR_FRT_9790: {
      url: "/map-tiles/MTR_FRT_9790/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Abeyance Forest Realm
    MTR_FRT_9794: {
      url: "/map-tiles/MTR_FRT_9794/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Abeyance Forest Realm
    MTR_FRT_9802: {
      url: "/map-tiles/MTR_FRT_9802/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Abeyance Forest Realm
    MTR_FRT_9806: {
      url: "/map-tiles/MTR_FRT_9806/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    // Abeyance Desert Realm
    MTR_DES_8576: {
      url: "/map-tiles/MTR_DES_8576/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Antiquarian Desert Realm
    MTR_DES_8580: {
      url: "/map-tiles/MTR_DES_8580/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Abeyance Swamp
    MTR_SWP_9610: {
      url: "/map-tiles/MTR_SWP_9610/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Antiquarian Swamp
    MTR_SWP_9624: {
      url: "/map-tiles/MTR_SWP_9624/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Gloom Swamp
    MTR_SWP_9620: {
      url: "/map-tiles/MTR_SWP_9620/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Gloom Swamp
    MTR_SWP_9622: {
      url: "/map-tiles/MTR_SWP_9622/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Herbarium Desert
    MTR_DES_8569: {
      url: "/map-tiles/MTR_DES_8569/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    // Herbarium Swamp
    MTR_SWP_9629: {
      url: "/map-tiles/MTR_SWP_9629/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    // Hunt Forest
    MTR_FRT_9813: {
      url: "/map-tiles/MTR_FRT_9813/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Provisioner Forest
    MTR_FRT_9805: {
      url: "/map-tiles/MTR_FRT_9805/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    // Provisioner Swamp
    MTR_SWP_9619: {
      url: "/map-tiles/MTR_SWP_9619/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    MTR_DES_8566: {
      url: "/map-tiles/MTR_DES_8566/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8567: {
      url: "/map-tiles/MTR_DES_8567/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8568: {
      url: "/map-tiles/MTR_DES_8568/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8570: {
      url: "/map-tiles/MTR_DES_8570/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8571: {
      url: "/map-tiles/MTR_DES_8571/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8572: {
      url: "/map-tiles/MTR_DES_8572/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8573: {
      url: "/map-tiles/MTR_DES_8573/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8574: {
      url: "/map-tiles/MTR_DES_8574/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8575: {
      url: "/map-tiles/MTR_DES_8575/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8577: {
      url: "/map-tiles/MTR_DES_8577/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8578: {
      url: "/map-tiles/MTR_DES_8578/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8579: {
      url: "/map-tiles/MTR_DES_8579/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8581: {
      url: "/map-tiles/MTR_DES_8581/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8582: {
      url: "/map-tiles/MTR_DES_8582/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8583: {
      url: "/map-tiles/MTR_DES_8583/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8584: {
      url: "/map-tiles/MTR_DES_8584/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8585: {
      url: "/map-tiles/MTR_DES_8585/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8586: {
      url: "/map-tiles/MTR_DES_8586/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8587: {
      url: "/map-tiles/MTR_DES_8587/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8588: {
      url: "/map-tiles/MTR_DES_8588/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_DES_8589: {
      url: "/map-tiles/MTR_DES_8589/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_7284: {
      url: "/map-tiles/MTR_FRT_7284/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9791: {
      url: "/map-tiles/MTR_FRT_9791/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9792: {
      url: "/map-tiles/MTR_FRT_9792/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9793: {
      url: "/map-tiles/MTR_FRT_9793/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9796: {
      url: "/map-tiles/MTR_FRT_9796/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_A,
        tileSize: TILE_SIZE,
      },
      ...TILE_A,
    },
    MTR_FRT_9799: {
      url: "/map-tiles/MTR_FRT_9799/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9801: {
      url: "/map-tiles/MTR_FRT_9801/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9803: {
      url: "/map-tiles/MTR_FRT_9803/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9804: {
      url: "/map-tiles/MTR_FRT_9804/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9807: {
      url: "/map-tiles/MTR_FRT_9807/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9808: {
      url: "/map-tiles/MTR_FRT_9808/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9810: {
      url: "/map-tiles/MTR_FRT_9810/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_FRT_9811: {
      url: "/map-tiles/MTR_FRT_9811/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9611: {
      url: "/map-tiles/MTR_SWP_9611/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9612: {
      url: "/map-tiles/MTR_SWP_9612/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9613: {
      url: "/map-tiles/MTR_SWP_9613/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9614: {
      url: "/map-tiles/MTR_SWP_9614/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9616: {
      url: "/map-tiles/MTR_SWP_9616/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9617: {
      url: "/map-tiles/MTR_SWP_9617/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9618: {
      url: "/map-tiles/MTR_SWP_9618/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9621: {
      url: "/map-tiles/MTR_SWP_9621/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9623: {
      url: "/map-tiles/MTR_SWP_9623/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },

    MTR_SWP_9625: {
      url: "/map-tiles/MTR_SWP_9625/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9626: {
      url: "/map-tiles/MTR_SWP_9626/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9627: {
      url: "/map-tiles/MTR_SWP_9627/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9632: {
      url: "/map-tiles/MTR_SWP_9632/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    MTR_SWP_9633: {
      url: "/map-tiles/MTR_SWP_9633/{z}/{y}/{x}.webp",
      options: {
        minNativeZoom: 0,
        maxNativeZoom: 3,
        bounds: MAP_BOUNDS_B,
        tileSize: TILE_SIZE,
      },
      ...TILE_B,
    },
    // Unknown Realm
    MTR_CAV_0018: TILE_B,
    MTR_CAV_0025: TILE_B,
    MTR_CAV_0026: TILE_B,
    MTR_CAV_0027: TILE_B,
    MTR_FRT_8773: TILE_B,
    NightmareRealm: TILE_B,
    MTR_SWP_5473: TILE_B,
  },
};
