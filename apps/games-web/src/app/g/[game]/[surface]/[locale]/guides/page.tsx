import {
  createGuidesPage,
  createGuidesPageGenerateMetadata,
} from "@repo/ui/apps";
import { multiTenant } from "@/lib/multi-tenant";

export const generateMetadata = multiTenant(createGuidesPageGenerateMetadata);
export default multiTenant(createGuidesPage);
