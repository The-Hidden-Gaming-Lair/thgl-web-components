import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import { buildSidebarGroups } from "@/lib/db/db-section-layout";

/**
 * The grouped item list for a `/db/<section>` sidebar, so `DetailSidebarClient`
 * can load it in the browser instead of receiving it as server props.
 *
 * WHY: the sidebar lists EVERY entry in the section, and it was serialised into
 * the RSC payload and rendered as HTML on every page under that section. A
 * single `/db/inventory/<id>` page on Palworld carried all 2,342 item links and
 * weighed 1.87 MB, versus 424 KB for a 286-entry section — and production render
 * time tracks HTML size almost exactly. A crawler walking those 2,342 detail
 * URLs made the origin render 1.87 MB every time.
 *
 * Fetched once per (tenant, section, locale) and reused across navigations, so
 * moving between two entries in the same section no longer re-ships the list.
 *
 * Resolution mirrors `[locale]/db/[section]/layout.tsx` exactly (same section
 * lookup, same `types`, same empty `groupLabelPrefix`) so the response is
 * identical to what that layout used to render inline. Sections with a bespoke
 * layout keep building their groups server-side and never call this.
 *
 * Cache-Control is deliberately NOT set here: next.config.js's `/:path*` rule
 * wins over route-level headers (verified live — /api/db/search-index asks for
 * s-maxage=60 and is served 86400), giving this the same 1-day edge cache and
 * the same per-tenant purge on a data change as the pages themselves.
 */
export async function GET(request: Request) {
  const appConfig = await getAppConfig();
  if (!appConfig.db) notFound();

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");
  const locale = searchParams.get("locale") || DEFAULT_LOCALE;
  if (!section) {
    return NextResponse.json({ error: "section required" }, { status: 400 });
  }

  const secCfg = appConfig.db.homeSections.find(
    (s) => s.href === `/db/${section}` || s.type === section,
  );
  if (!secCfg) notFound();

  const groups = await buildSidebarGroups({
    appConfig,
    types: [secCfg.type, ...(secCfg.extraTypes ?? [])],
    groupLabelPrefix: "",
    locale,
  });

  return NextResponse.json({ groups });
}
