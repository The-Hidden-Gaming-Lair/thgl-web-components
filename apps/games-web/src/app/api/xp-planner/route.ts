import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, fetchVersion } from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { getAppConfig } from "@/lib/get-app-config";
import { loadXpPlanner, xpDict, xpPayload } from "@/lib/xp-planner/data";

/**
 * The XP planner's client payload for one locale: curve, skills and every
 * method with its localized name, icon and codex/map links. Loaded by the
 * browser instead of being serialised into each page (Dragonwilds ships
 * 1,600+ methods). Edge caching comes from next.config.js's `/:path*` rule.
 */
export async function GET(request: Request) {
  const appConfig = await getAppConfig();
  const config = await loadXpPlanner(appConfig);
  if (!config) notFound();

  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || DEFAULT_LOCALE;
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);

  return NextResponse.json(
    await xpPayload(appConfig, config, xpDict(config, dict, locale), version),
  );
}
