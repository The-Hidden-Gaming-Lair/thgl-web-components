import { createMapsPage, createMapsPageGenerateMetadata } from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

export const generateMetadata = multiTenant(createMapsPageGenerateMetadata);
export default multiTenant(createMapsPage);
