import { createMapPageGenerateMetadata } from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";
import { multiTenantMapPage } from "@/lib/map-page";

export const generateMetadata = multiTenant(createMapPageGenerateMetadata);
export default multiTenantMapPage();
