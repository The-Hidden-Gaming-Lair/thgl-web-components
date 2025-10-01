import { APP_CONFIG } from "@/config";
import {
  createGuidePageGenerateMetadata,
  createGuidePage,
} from "@repo/ui/apps";

export const generateMetadata = createGuidePageGenerateMetadata(APP_CONFIG);

export default createGuidePage(APP_CONFIG);
