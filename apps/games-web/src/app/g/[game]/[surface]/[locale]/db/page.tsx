import { createDbPage, createDbPageGenerateMetadata } from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

/**
 * Generic `/db` database landing — the section-overview hub (header + a card per
 * `db.homeSections`) for any tenant that defines `db`. Mirrors the `/maps` and
 * `/guides` listing pages; games without a `db` config 404 inside createDbPage.
 */
export const generateMetadata = multiTenant(createDbPageGenerateMetadata);
export default multiTenant(createDbPage);

// Cached in Next's page cache (cache-handler.cjs): rendered once per pod and
// game data version, then served without re-rendering — see
// src/lib/route-params.ts. No dynamic APIs below this route; plain fetches stay
// uncached so a re-render after a data update always sees fresh data.
export const dynamic = "force-static";
export const fetchCache = "default-no-store";
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}
