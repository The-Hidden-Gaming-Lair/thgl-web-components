import { DATA_FORGE_CDN_URL, fetchJsonWithMemoryCache } from "./config";
import type { ActivitiesConfig } from "./activities";

/**
 * Loading side of the activities tracker: the game's
 * `config/activities.json`, null when the game ships none (the page 404s
 * then — no per-game list in the frontend).
 */
export async function fetchActivitiesConfig(
  appName: string,
): Promise<ActivitiesConfig | null> {
  const data = await fetchJsonWithMemoryCache<ActivitiesConfig | null>(
    `${DATA_FORGE_CDN_URL}/${appName}/config/activities.json`,
    { onNotFound: () => null },
  ).catch(() => null);
  if (
    !data ||
    !Array.isArray(data.activities) ||
    !data.activities.length ||
    !data.reset?.regions?.length
  ) {
    return null;
  }
  return data;
}
