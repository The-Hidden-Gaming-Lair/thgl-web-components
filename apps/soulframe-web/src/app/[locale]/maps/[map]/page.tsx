import { APP_CONFIG } from "@/config";
import { createMapPageGenerateMetadata, createMapPage } from "@repo/ui/apps";

export const generateMetadata = createMapPageGenerateMetadata(APP_CONFIG);

export default createMapPage(APP_CONFIG);
