import type { MarkerOptions } from "./types";
import type { Region } from "./coordinates";
import type { Drawing, PrivateNode } from "./settings";
import type { LatLngExpression } from "leaflet";

export type IconName =
  | "House"
  | "Map"
  | "Server"
  | "BookOpen"
  | "ScrollText"
  | "ArrowUp"
  | "Bug"
  | "NotepadText"
  | "Axe"
  | "Gift"
  | "MapPin"
  | "Trophy"
  | "SquareCheckBig"
  | "MessageSquareWarning"
  | "Grid"
  | "Megaphone"
  | "MonitorSmartphone"
  | "Heart"
  | "Handshake"
  | "Newspaper"
  | "HelpCircle"
  | "FileText"
  | "ShieldCheck";

export type AppConfig = {
  name: string;
  domain: string;
  title: string;
  appUrl: string | null;
  withoutLiveMode?: boolean;
  internalLinks?: {
    title: string;
    description: string;
    href: string;
    linkText?: string;
    bgImage?: string;
    iconName: IconName;
  }[];
  externalLinks?: { href: string; title: string }[];
  markerOptions?: MarkerOptions;
  keywords?: string[];
};

export type OverwolfAppConfig = {
  name: string;
  domain: string;
  title: string;
  gameClassId: number;
  appUrl: string;
  withoutLiveMode?: boolean;
  appId: string;
  discordApplicationId: string;
  markerOptions: MarkerOptions;
};

export type THGLAppConfig = {
  name: string;
  domain: string;
  title: string;
  withoutOverlayMode?: boolean;
  withoutLiveMode?: boolean;
  markerOptions: MarkerOptions;
  defaultHotkeys: Record<string, string>;
};

export type Version = {
  id: string;
  createdAt: number;
  data: {
    enDict: Record<string, string>;
    filters: FiltersConfig;
    regions: Region[];
    tiles: TilesConfig;
    globalFilters: GlobalFiltersConfig;
    typesIdMap: Record<string, string>;
    database: DatabaseConfig;
    drawings: DrawingsConfig;
  };
  more: {
    nodes: Record<string, string>;
    icons: string;
  };
};

export const TH_GL_URL = "https://www.th.gl";
export const API_FORGE_URL = "https://api-forge.th.gl";
// export const TH_GL_URL = "http://localhost:3006";
export const DATA_FORGE_URL = "https://data.th.gl";
// export const DATA_FORGE_URL = "http://localhost:3000";

export function getAppUrl(appName: string, path: string): string {
  return `${DATA_FORGE_URL}/${appName}${path}`;
}

export function fetchVersion(appName: string): Promise<Version> {
  return fetch(getAppUrl(appName, "/version.json"), {
    // @ts-ignore
    // next: { revalidate: 60 },
  }).then((res) => res.json());
}

export function getMapNameFromVersion(
  version: Version,
  map: string,
): string | null {
  const decodedMap = decodeURIComponent(map);
  const mapNames = Object.entries(version.data.enDict).filter(
    ([, v]) => v === decodedMap,
  );
  const mapName = mapNames.find(([k]) => version.data.tiles[k])?.[0];
  if (!mapName) {
    return null;
  }
  return mapName;
}

export function getIconsUrl(
  appName: string,
  icon: string,
  path?: string,
): string {
  if (icon.startsWith("/global_icons/game-icons")) {
    return `${DATA_FORGE_URL}${icon.replace("/global_icons", "")}`;
  }
  if (icon.includes("global_icons")) {
    return icon;
  }
  if ((icon === "icons.webp" || icon === "/icons/icons.webp") && path) {
    return getAppUrl(appName, path);
  }
  if (icon.startsWith("/")) {
    return getAppUrl(appName, icon);
  }
  return getAppUrl(appName, `/icons/${icon}`);
}

export async function fetchDict(
  appName: string,
): Promise<Record<string, string>> {
  const res = await fetch(`${DATA_FORGE_URL}/${appName}/dicts/en.json`);
  return res.json();
}

export async function fetchDatabase(appName: string): Promise<DatabaseConfig> {
  const res = await fetch(`${DATA_FORGE_URL}/${appName}/config/database.json`);
  return res.json();
}

export async function fetchDrawings(appName: string): Promise<DrawingsConfig> {
  const res = await fetch(`${DATA_FORGE_URL}/${appName}/config/drawings.json`);
  return res.json();
}

export async function fetchFilters(appName: string): Promise<FiltersConfig> {
  const res = await fetch(`${DATA_FORGE_URL}/${appName}/config/filters.json`);
  return res.json();
}

export async function fetchRegions(appName: string): Promise<RegionsConfig> {
  const res = await fetch(`${DATA_FORGE_URL}/${appName}/config/regions.json`);
  return res.json();
}

export async function fetchTiles(appName: string): Promise<TilesConfig> {
  const res = await fetch(`${DATA_FORGE_URL}/${appName}/config/tiles.json`);
  return res.json();
}

export async function fetchGlobalFilters(
  appName: string,
): Promise<GlobalFiltersConfig> {
  const res = await fetch(
    `${DATA_FORGE_URL}/${appName}/config/global-filters.json`,
  );
  return res.json();
}

export async function fetchTypesIdMap(
  appName: string,
): Promise<Record<string, string>> {
  const res = await fetch(
    `${DATA_FORGE_URL}/${appName}/config/types_id_map.json`,
  );
  return res.json();
}

export type GlobalFiltersConfig = Array<{
  group: string;
  values: Array<{
    id: string;
    defaultOn?: boolean;
  }>;
}>;

export type DrawingsConfig = {
  name: string;
  isShared?: boolean;
  url?: string;
  nodes?: PrivateNode[];
  drawing?: Drawing;
}[];

export type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Icon = string | IconSprite;
export type DatabaseConfig<T = Record<string, any>> = {
  type: string;
  items: {
    id: string;
    icon?: Icon;
    props: T;
    groupId?: string;
  }[];
}[];

export type FiltersConfig = {
  group: string;
  defaultOpen?: boolean;
  defaultOn?: boolean;
  values: {
    id: string;
    icon:
      | string
      | {
          name: string;
          url: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };
    size?: number;
    live_only?: boolean;
    autoDiscover?: boolean;
    defaultOn?: boolean;
  }[];
}[];

export type RegionsConfig = Region[];

export type TileLayer = {
  url?: string;
  options?: {
    minNativeZoom: number;
    maxNativeZoom: number;
    bounds: [[number, number], [number, number]];
    tileSize: number;
    threshold?: number;
  };
  minZoom?: number;
  maxZoom?: number;
  fitBounds?: [[number, number], [number, number]];
  view?: { center: LatLngExpression; zoom?: number };
  transformation?: [number, number, number, number];
  threshold?: number;
  rotation?: {
    center: [number, number];
    angle: number;
  };
};
export type TilesConfig = Record<string, TileLayer>;
