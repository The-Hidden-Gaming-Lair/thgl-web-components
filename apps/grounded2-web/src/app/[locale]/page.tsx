import { APP_CONFIG } from "@/config";
import { createHomePage, createHomePageGenerateMetadata } from "@repo/ui/apps";

export const generateMetadata = createHomePageGenerateMetadata(APP_CONFIG);

export default createHomePage(APP_CONFIG);
