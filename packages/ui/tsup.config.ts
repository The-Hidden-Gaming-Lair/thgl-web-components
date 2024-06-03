import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  banner: {
    js: "'use client'",
  },
  entry: {
    ads: "src/components/(ads)/index.tsx",
    controls: "src/components/(controls)/index.tsx",
    data: "src/components/(data)/index.tsx",
    header: "src/components/(header)/index.tsx",
    "interactive-map": "src/components/(interactive-map)/index.tsx",
    providers: "src/components/(providers)/index.tsx",
    overwolf: "src/components/(overwolf)/index.tsx",
  },
  format: ["esm"],
  target: "es2021",
  esbuildOptions(options) {
    options.external = ["react", "react-dom"];
  },
  ...options,
}));
