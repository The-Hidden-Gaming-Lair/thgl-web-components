import { type AppConfig, DEFAULT_LOCALE } from "@repo/lib";
import { notFound } from "next/navigation";
import { createHomePage, createHomePageGenerateMetadata } from "@repo/ui/apps";
import { isValidLocale } from "@repo/ui/dicts";
import {
  createDbHomePage,
  createDbHomePageGenerateMetadata,
} from "@/lib/db/home-page";
import { getAppConfig } from "@/lib/get-app-config";
import { getSiteKind } from "@/lib/site-kind";

type PageProps = { params: Promise<{ locale?: string }> };

/**
 * Bail out for non-locale segments before any data fetches. The
 * `[locale]` route catches every unmatched top-level path (favicon
 * lookups, apple-touch-icon, random scanner probes, etc.) — the layout
 * already calls notFound() for invalid locales, but the page renders
 * in parallel and triggers spurious fetchDict 404s in the logs before
 * the layout's notFound wins. Guarding here short-circuits both.
 */
function assertLocaleOrNotFound(rawLocale: string | undefined): string {
  const locale = rawLocale ?? DEFAULT_LOCALE;
  if (!isValidLocale(locale)) notFound();
  return locale;
}

/**
 * DB-only sites (homm — has `appConfig.db` AND no map filters) render
 * the bespoke DB landing with entity-count stats. Hybrid DB sites
 * (BPSR — has both maps and DB) and pure map games fall through to
 * the standard map-home page with internalLinks + recent updates.
 *
 * Using `version.data.filters.length === 0` as the signal because a
 * map-shipped game always has filters, while a DB-only deployment
 * publishes an empty filters array.
 */
async function isDbOnly(config: AppConfig): Promise<boolean> {
  if (!config.db) return false;
  const { hasMap } = await getSiteKind(config);
  return !hasMap;
}

export async function generateMetadata(props: PageProps) {
  const { locale } = await props.params;
  assertLocaleOrNotFound(locale);
  const config = await getAppConfig();
  // Mirror the layout's thgl-app gate: the layout already notFound()s
  // this tenant, but pages render in parallel and would otherwise
  // kick off CDN/Discord fetches for `thgl-app` (which 404 or
  // ETIMEDOUT, polluting logs).
  if (config.name === "thgl-app") notFound();
  const dbOnly = await isDbOnly(config);
  const factory = dbOnly
    ? createDbHomePageGenerateMetadata
    : createHomePageGenerateMetadata;
  return factory(config)(props);
}

export default async function Page(props: PageProps) {
  const { locale } = await props.params;
  assertLocaleOrNotFound(locale);
  const config = await getAppConfig();
  if (config.name === "thgl-app") notFound();
  const dbOnly = await isDbOnly(config);
  const factory = dbOnly ? createDbHomePage : createHomePage;
  return factory(config)(props);
}
