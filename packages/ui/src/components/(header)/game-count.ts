import apps from "./global-menu.json";

/**
 * "50+"-style count of the games in the game switcher, for marketing copy
 * (www hero/metadata). A plain module, not the "use client" switcher, so
 * server components get the value instead of a client reference.
 */
export const GAME_COUNT_LABEL = `${Math.floor(apps.length / 10) * 10}+`;
