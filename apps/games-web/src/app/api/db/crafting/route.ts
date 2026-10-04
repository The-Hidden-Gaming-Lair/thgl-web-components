import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, fetchVersion } from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { getAppConfig } from "@/lib/get-app-config";
import { craftItemInfos, loadCrafting } from "@/lib/crafting/data";

/**
 * The crafting calculator's client payload: the slim recipe entries (the
 * client rebuilds the graph with the same `buildCraftingGraph`) plus name,
 * icon and codex/map links per item for one locale.
 *
 * Loaded by the browser instead of being serialised into the /crafting page:
 * a game with 3,000+ recipes would otherwise ship the whole graph twice (RSC
 * payload + HTML) on every hub render — the same reason `/api/db/sidebar`
 * exists. Edge caching comes from next.config.js's `/:path*` rule (1 day,
 * purged per tenant on a data change).
 */
export async function GET(request: Request) {
  const appConfig = await getAppConfig();
  const data = await loadCrafting(appConfig);
  if (!data) notFound();

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || DEFAULT_LOCALE;
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);

  return NextResponse.json({
    source: data.source,
    items: craftItemInfos(appConfig, data, dict, version),
    iconsHash: version.more.icons,
  });
}
