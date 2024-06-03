import { defineConfig, type Options } from "tsup";

export default defineConfig((options: Options) => ({
  entryPoints: ["src/index.ts", "src/overwolf/index.ts"],
  dts: true,
  format: ["esm"],
  target: "es2021",
  ...options,
}));
