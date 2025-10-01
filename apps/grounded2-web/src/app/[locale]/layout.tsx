import "@/styles/globals.css";
import "@repo/ui/styles/globals.css";

import { APP_CONFIG } from "@/config";
import {
  createRootLayout,
  createRootLayoutMetadata,
  rootLayoutViewport,
} from "@repo/ui/apps";

export const viewport = rootLayoutViewport;

export const metadata = createRootLayoutMetadata(APP_CONFIG);

export const revalidate = 60;

export default createRootLayout(APP_CONFIG);
