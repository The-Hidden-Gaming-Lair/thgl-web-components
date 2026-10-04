import {
  DATA_FORGE_CDN_URL,
  fetchJsonWithMemoryCache,
  type AppConfig,
} from "./config";
import { trainableSkills, XP_PLANNER_PATH, type XpConfig } from "./xp-planner";

/**
 * Loading side of the skill XP planner: the game's `config/xp.json`, null when
 * the game ships none (the pages 404 then — no per-game list).
 */
export async function fetchXpConfig(appName: string): Promise<XpConfig | null> {
  const data = await fetchJsonWithMemoryCache<XpConfig | null>(
    `${DATA_FORGE_CDN_URL}/${appName}/config/xp.json`,
    { onNotFound: () => null },
  ).catch(() => null);
  if (!data || !Array.isArray(data.curve) || !Array.isArray(data.methods)) {
    return null;
  }
  return data;
}

/** The tenant lists the planner in its nav (sitemap + discovery opt-in). */
export function hasXpPlannerLink(appConfig: AppConfig): boolean {
  return (appConfig.internalLinks ?? []).some(
    (l) => l.href === XP_PLANNER_PATH && !l.previewOnly,
  );
}

/** Sitemap paths of the per-skill pages (`/xp-planner/<skill>`). */
export async function xpPlannerSitemapPaths(
  appConfig: AppConfig,
): Promise<string[]> {
  if (!hasXpPlannerLink(appConfig)) return [];
  const config = await fetchXpConfig(appConfig.name);
  if (!config) return [];
  return trainableSkills(config).map(
    (s) => `${XP_PLANNER_PATH}/${encodeURIComponent(s.id)}`,
  );
}
