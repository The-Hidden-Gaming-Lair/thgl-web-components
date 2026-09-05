import { type AppConfig, isDevForgeHost } from "@repo/lib";
import { avowed } from "./avowed";
import { blueProtocolStarResonance } from "./blue-protocol-star-resonance";
import { chronoOdyssey } from "./chrono-odyssey";
import { conanExiles } from "./conan-exiles";
import { crimsonDesert } from "./crimson-desert";
import { dawnwalker } from "./dawnwalker";
import { diablo4 } from "./diablo4";
import { dragonswordAwakening } from "./dragonsword-awakening";
import { drakantos } from "./drakantos";
import { duetNightAbyss } from "./duet-night-abyss";
import { enshrouded } from "./enshrouded";
import { duneAwakening } from "./dune-awakening";
import { gothic1Remake } from "./gothic-1-remake";
import { grounded2 } from "./grounded2";
import { heartopia } from "./heartopia";
import { hogwartsLegacy } from "./hogwarts-legacy";
import { hommOldenEra } from "./homm-olden-era";
import { infinityNikki } from "./infinity-nikki";
import { nevernessToEverness } from "./neverness-to-everness";
import { nightCrows } from "./night-crows";
import { onceHuman } from "./once-human";
import { palia } from "./palia";
import { palworld } from "./palworld";
import { paxDei } from "./pax-dei";
import { rsdragonwilds } from "./rsdragonwilds";
import { satisfactory } from "./satisfactory";
import { songsOfConquest } from "./songs-of-conquest";
import { soulframe } from "./soulframe";
import { soulmask } from "./soulmask";
import { starsandIsland } from "./starsand-island";
import { subnautica2 } from "./subnautica-2";
import { thglApp } from "./thgl-app";
import { thglWeb } from "./thgl-web";
import { witchspire } from "./witchspire";
import { wutheringWaves } from "./wuthering-waves";

/**
 * All app configs that this multi-tenant deployment serves.
 * Add a new game by importing its config and adding it to this array.
 */
const ALL_CONFIGS: AppConfig[] = [
  avowed,
  blueProtocolStarResonance,
  chronoOdyssey,
  conanExiles,
  crimsonDesert,
  dawnwalker,
  diablo4,
  dragonswordAwakening,
  drakantos,
  duetNightAbyss,
  duneAwakening,
  enshrouded,
  gothic1Remake,
  grounded2,
  heartopia,
  hogwartsLegacy,
  hommOldenEra,
  infinityNikki,
  nevernessToEverness,
  nightCrows,
  onceHuman,
  palia,
  palworld,
  paxDei,
  rsdragonwilds,
  satisfactory,
  songsOfConquest,
  soulframe,
  soulmask,
  starsandIsland,
  subnautica2,
  thglApp,
  thglWeb,
  witchspire,
  wutheringWaves,
];

/**
 * Registry keyed by hostname subdomain (AppConfig.domain). This is what
 * appears in the URL — e.g. "nightcrows" for nightcrows.th.gl, even when
 * the canonical AppConfig.name uses a different slug ("night-crows").
 */
const BY_DOMAIN: Record<string, AppConfig> = Object.fromEntries(
  ALL_CONFIGS.map((c) => [c.domain, c]),
);

/**
 * Registry keyed by AppConfig.name (canonical slug used internally).
 */
const BY_NAME: Record<string, AppConfig> = Object.fromEntries(
  ALL_CONFIGS.map((c) => [c.name, c]),
);

/**
 * Resolve an app config from a hostname like "avowed.th.gl" or
 * "nightcrows.localhost:3100". Returns null if the hostname doesn't
 * match a registered app.
 */
export function getAppConfigByHost(host: string): AppConfig | null {
  const cleanHost = host.split(":")[0].replace(/\.$/, "");
  let subdomain = cleanHost.split(".")[0];
  // palia-dev.localhost serves the palia tenant against the local
  // data-forge (see the forge dev proxy in @repo/lib config + proxy.ts).
  if (isDevForgeHost(host)) {
    subdomain = subdomain.slice(0, -"-dev".length);
  }
  return BY_DOMAIN[subdomain] ?? null;
}

/**
 * Resolve an app config from its canonical slug (AppConfig.name).
 */
export function getAppConfigBySlug(slug: string): AppConfig | null {
  return BY_NAME[slug] ?? null;
}

/**
 * List all registered apps.
 */
export function getRegisteredApps(): AppConfig[] {
  return ALL_CONFIGS;
}
