import { APP_CONFIG } from "@/config";
import {
  createGuidesPageGenerateMetadata,
  createGuidesPage,
} from "@repo/ui/apps";

export const generateMetadata = createGuidesPageGenerateMetadata(APP_CONFIG);

export default createGuidesPage(APP_CONFIG);
