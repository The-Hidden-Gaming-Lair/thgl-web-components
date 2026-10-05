import {
  createGuidePage,
  createGuidePageGenerateMetadata,
} from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

export const generateMetadata = multiTenant(createGuidePageGenerateMetadata);
export default multiTenant(createGuidePage);
