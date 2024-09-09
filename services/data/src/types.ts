export type Node = {
  type: string;
  static?: boolean;
  mapName?: string;
  spawns: {
    id?: string;
    p: [number, number] | [number, number, number];
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
    autoDiscover?: boolean;
    defaultOn?: boolean;
  }[];
};

export type GlobalFilter = {
  group: string;
  values: {
    id: string;
    defaultOn?: boolean;
  }[];
};

export type Database = {
  type: string;
  items: {
    id: string;
    icon?: string;
    props: Record<string, any>;
    groupId?: string;
  }[];
}[];

export type Group = {
  id: string;
  icon: string;
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

export type UEObjects = Array<{
  Type: string;
  Name: string;
  Outer: string;
  Class?: string;
  Properties?: any;
}>;
