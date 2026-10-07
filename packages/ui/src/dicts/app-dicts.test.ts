import { readdirSync, readFileSync } from "fs";
import { join } from "path";

// App dicts load per locale with no per-key English fallback: a key missing
// from `<app>.<locale>.json` renders the raw key or the English config string
// on that locale's pages (inbox #754). Every locale must carry every English key.
const dir = __dirname;
const files = readdirSync(dir).filter((f) =>
  /^[a-z0-9-]+\.[A-Za-z-]+\.json$/.test(f),
);
const read = (file: string): Record<string, string> =>
  JSON.parse(readFileSync(join(dir, file), "utf8"));
// [locale file, its app's English file]; English-only apps have no pairs.
const pairs = files
  .filter((f) => !f.endsWith(".en.json"))
  .map((f) => [f, `${f.slice(0, f.indexOf("."))}.en.json`])
  .filter(([, en]) => files.includes(en!));

it.each(pairs)("%s has every key of %s", (file, en) => {
  const dict = read(file!);
  expect(Object.keys(read(en!)).filter((k) => !(k in dict))).toEqual([]);
});

// Global dicts fall back to the English string passed as `fallback` (or the
// raw key), so a missing key shows English on that locale's pages (#755).
const globalFiles = readdirSync(dir).filter(
  (f) => /^[A-Za-z-]+\.json$/.test(f) && f !== "en.json",
);

it.each(globalFiles)("%s has every key of en.json", (file) => {
  const dict = read(file);
  expect(Object.keys(read("en.json")).filter((k) => !(k in dict))).toEqual([]);
});
