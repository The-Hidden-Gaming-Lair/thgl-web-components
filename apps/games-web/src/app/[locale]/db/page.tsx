import { createDbPage, createDbPageGenerateMetadata } from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

/**
 * Generic `/db` database landing — the section-overview hub (header + a card per
 * `db.homeSections`) for any tenant that defines `db`. Mirrors the `/maps` and
 * `/guides` listing pages; games without a `db` config 404 inside createDbPage.
 */
export const generateMetadata = multiTenant(createDbPageGenerateMetadata);
export default multiTenant(createDbPage);
