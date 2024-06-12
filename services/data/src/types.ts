export type Node = {
  type: string;
  static?: boolean;
  spawns: {
    id?: string;
    p: [number, number];
    mapName: string;
    icon?: {
      name: string;
      url: string;
    };
    data?: Record<string, string[]>;
  }[];
};

export type Filter = {
  group: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon: string;
    size?: number;
    live_only?: boolean;
  }[];
};

export type GlobalFilter = {
  group: string;
  values: {
    id: string;
    defaultOn?: boolean;
  }[];
};

export type Dict = Record<string, string>;

export type Tiles = Record<
  string,
  {
    url?: string;
    options?: {
      minNativeZoom: number;
      maxNativeZoom: number;
      bounds: [[number, number], [number, number]];
      tileSize: number;
    };
    minZoom?: number;
    maxZoom?: number;
    fitBounds?: [[number, number], [number, number]];
    transformation?: [number, number, number, number];
  }
>;

export type Actors = Record<string, [number, number, number, string][]>;

export type Region = {
  id: string;
  center: [number, number];
  border: [number, number][];
  mapName: string;
};

export type TypesIds = Record<string, string>;
