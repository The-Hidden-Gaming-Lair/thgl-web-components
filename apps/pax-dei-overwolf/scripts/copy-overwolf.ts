import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import manifest from "../manifest.json" assert { type: "json" };

const __dirname = fileURLToPath(new URL(".", import.meta.url));

manifest.meta.name = manifest.meta.name.replace("-DEV", "");
// @ts-expect-error
delete manifest.data.windows.background.debug_url;
manifest.data.windows.background.block_top_window_navigation = true;
// @ts-expect-error
delete manifest.data.windows.desktop.debug_url;
manifest.data.windows.desktop.block_top_window_navigation = true;
// @ts-expect-error
delete manifest.data.windows.overlay.debug_url;
manifest.data.windows.overlay.block_top_window_navigation = true;

await fs.writeFile(
  path.resolve(__dirname, "../dist/manifest.json"),
  JSON.stringify(manifest),
);
await fs.cp(
  path.resolve(__dirname, "../icons/"),
  path.resolve(__dirname, "../dist/icons/"),
  { recursive: true },
);
await fs.cp(
  path.resolve(__dirname, "../plugins/"),
  path.resolve(__dirname, "../dist/plugins/"),
  { recursive: true },
);
