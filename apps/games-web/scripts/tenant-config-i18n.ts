#!/usr/bin/env bun
/**
 * Move a tenant config's plain English UI strings into its app dict, so /de, /ja …
 * pages stop showing English there (inbox #756, precedent: Conan #754).
 *
 *   bun apps/games-web/scripts/tenant-config-i18n.ts <tenant…>
 *       Rewrites apps/games-web/src/configs/<tenant>.ts: every English string below
 *       becomes a `config.*` key whose English text goes to
 *       packages/ui/src/dicts/<tenant>.en.json. Prints the keys each supported
 *       locale still lacks as JSON ({ tenant: { locale: { key: english } } }).
 *   bun apps/games-web/scripts/tenant-config-i18n.ts --apply <file.json>
 *       Merges translations in that same shape into <tenant>.<locale>.json and
 *       registers the existing locale files in dicts/index.ts `appDictionaries`.
 *
 * Strings moved (all rendered through t()/resolveDict, which pass keys through):
 * internalLinks title (not "/maps/…" titles, #755 localizes "<Map> Map"
 * generically) / description / linkText, externalLinks title, db.heroSubtitle,
 * db.searchPlaceholder, db.homeSections description + titleFallback (as a new
 * titleKey; the English fallback stays), db.homeExtraLinks title / description,
 * db.typeLabels (stored singular, as getSectionLabels skips `singularize` for a
 * resolved label). Values that already are dict keys are left alone; an English
 * value the tenant or global dict already has reuses that key.
 * app-dicts.test.ts guards that every locale file carries every English key.
 */
import { execFileSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import ts from "typescript";
import { singularize } from "../src/lib/db/seo";

const root = join(import.meta.dir, "..", "..", "..");
const configsDir = join(root, "apps", "games-web", "src", "configs");
const dictsDir = join(root, "packages", "ui", "src", "dicts");
const indexPath = join(dictsDir, "index.ts");

type Dict = Record<string, string>;
const readJson = (path: string): Dict =>
  existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
const writeJson = (path: string, dict: Dict) =>
  writeFileSync(path, JSON.stringify(dict, null, 2) + "\n");
const dictPath = (tenant: string, locale: string) =>
  join(dictsDir, `${tenant}.${locale}.json`);
const prettier = (...files: string[]) =>
  execFileSync(
    join(root, "node_modules", ".bin", "prettier"),
    ["--write", "--log-level", "warn", ...files],
    { cwd: root, shell: process.platform === "win32" },
  );

const globalEn = readJson(join(dictsDir, "en.json"));
// Top-level global terms ("server_status", "database") are translated in every
// global locale, so an identical English value reuses them.
const globalByValue = new Map<string, string>();
for (const [k, v] of Object.entries(globalEn)) {
  if (!k.includes(".") && !globalByValue.has(v)) globalByValue.set(v, k);
}

function parseConfig(tenant: string) {
  const path = join(configsDir, `${tenant}.ts`);
  if (!existsSync(path)) throw new Error(`No config ${path}`);
  const text = readFileSync(path, "utf8");
  const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  let config: ts.ObjectLiteralExpression | undefined;
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sf) === "resolveAppConfig" &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      config = node.arguments[0];
    }
    if (!config) ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!config) throw new Error(`${tenant}: no resolveAppConfig({...}) found`);
  return { path, text, sf, config };
}

const propName = (p: ts.ObjectLiteralElementLike, sf: ts.SourceFile) =>
  ts.isPropertyAssignment(p)
    ? p.name.getText(sf).replace(/^["']|["']$/g, "")
    : "";
const prop = (
  obj: ts.ObjectLiteralExpression,
  name: string,
  sf: ts.SourceFile,
) =>
  obj.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && propName(p, sf) === name,
  );
const objects = (node: ts.Expression | undefined) =>
  node && ts.isArrayLiteralExpression(node)
    ? node.elements.filter(ts.isObjectLiteralExpression)
    : [];
const stringOf = (node: ts.Expression | undefined) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node
    : undefined;
const slugOf = (href: string) =>
  /^https?:\/\//.test(href)
    ? new URL(href).hostname.split(".")[0]!
    : href
        .replace(/^\/(db\/)?/, "")
        .replace(/\/+$/, "")
        .replace(/\//g, "-") || "home";

function extract(tenant: string) {
  const { path, text, sf, config } = parseConfig(tenant);
  const enPath = dictPath(tenant, "en");
  const en = readJson(enPath);
  const enByValue = new Map<string, string>();
  for (const [k, v] of Object.entries(en)) {
    if (!enByValue.has(v)) enByValue.set(v, k);
  }
  const isKey = (v: string) =>
    v in en || v in globalEn || /^[\w-]+(\.[\w-]+)+$/.test(v);
  const edits: { start: number; end: number; text: string }[] = [];
  let moved = 0;

  const keyFor = (wanted: string, value: string, dedupe = true) => {
    if (dedupe) {
      const existing = enByValue.get(value) ?? globalByValue.get(value);
      if (existing) return existing;
    }
    let key = wanted;
    for (let i = 2; key in en && en[key] !== value; i++) key = `${wanted}${i}`;
    en[key] = value;
    if (!enByValue.has(value)) enByValue.set(value, key);
    return key;
  };
  const replace = (
    node: ts.Expression | undefined,
    wanted: string,
    transform = (v: string) => v,
    dedupe = true,
  ) => {
    const lit = stringOf(node);
    if (!lit || isKey(lit.text)) return;
    const key = keyFor(wanted, transform(lit.text), dedupe);
    edits.push({
      start: lit.getStart(sf),
      end: lit.getEnd(),
      text: JSON.stringify(key),
    });
    moved++;
  };

  for (const link of objects(prop(config, "internalLinks", sf)?.initializer)) {
    const href = stringOf(prop(link, "href", sf)?.initializer)?.text ?? "";
    const base = `config.internalLinks.${slugOf(href)}`;
    if (!href.startsWith("/maps/")) {
      replace(prop(link, "title", sf)?.initializer, `${base}.title`);
    }
    replace(prop(link, "description", sf)?.initializer, `${base}.description`);
    replace(prop(link, "linkText", sf)?.initializer, `${base}.linkText`);
  }
  for (const link of objects(prop(config, "externalLinks", sf)?.initializer)) {
    const href = stringOf(prop(link, "href", sf)?.initializer)?.text ?? "";
    replace(
      prop(link, "title", sf)?.initializer,
      `config.externalLinks.${slugOf(href)}.title`,
    );
  }
  const db = prop(config, "db", sf)?.initializer;
  if (db && ts.isObjectLiteralExpression(db)) {
    replace(
      prop(db, "heroSubtitle", sf)?.initializer,
      "config.db.heroSubtitle",
    );
    replace(
      prop(db, "searchPlaceholder", sf)?.initializer,
      "config.db.searchPlaceholder",
    );
    for (const section of objects(prop(db, "homeSections", sf)?.initializer)) {
      const type =
        stringOf(prop(section, "type", sf)?.initializer)?.text ??
        slugOf(stringOf(prop(section, "href", sf)?.initializer)?.text ?? "");
      replace(
        prop(section, "description", sf)?.initializer,
        `config.db.${type}.description`,
      );
      // The nav, DB home and section h1 read titleKey before titleFallback.
      const fallback = stringOf(
        prop(section, "titleFallback", sf)?.initializer,
      );
      if (fallback && !prop(section, "titleKey", sf) && !isKey(fallback.text)) {
        const key = keyFor(`config.db.${type}.title`, fallback.text);
        const at = prop(section, "titleFallback", sf)!.getStart(sf);
        edits.push({
          start: at,
          end: at,
          text: `titleKey: ${JSON.stringify(key)},\n`,
        });
        moved++;
      }
    }
    for (const link of objects(prop(db, "homeExtraLinks", sf)?.initializer)) {
      const href = stringOf(prop(link, "href", sf)?.initializer)?.text ?? "";
      const base = `config.db.extra.${slugOf(href)}`;
      replace(prop(link, "title", sf)?.initializer, `${base}.title`);
      replace(
        prop(link, "description", sf)?.initializer,
        `${base}.description`,
      );
    }
    const typeLabels = prop(db, "typeLabels", sf)?.initializer;
    if (typeLabels && ts.isObjectLiteralExpression(typeLabels)) {
      for (const p of typeLabels.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        replace(
          p.initializer,
          `config.db.typeLabels.${propName(p, sf)}`,
          singularize,
          false,
        );
      }
    }
  }

  if (edits.length) {
    let out = text;
    for (const e of edits.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, e.start) + e.text + out.slice(e.end);
    }
    writeFileSync(path, out);
    writeJson(enPath, en);
    prettier(path);
  }

  const locales = supportedLocales(config, sf).filter((l) => l !== "en");
  const missing: Record<string, Dict> = {};
  for (const locale of locales) {
    const dict = readJson(dictPath(tenant, locale));
    const lacks = Object.fromEntries(
      Object.entries(en).filter(([k]) => !(k in dict)),
    );
    if (Object.keys(lacks).length) missing[locale] = lacks;
  }
  console.error(
    `${tenant}: ${moved} string(s) moved, ${Object.keys(en).length} English keys, ` +
      `${Object.keys(missing).length}/${locales.length} locale(s) incomplete`,
  );
  return missing;
}

function supportedLocales(
  config: ts.ObjectLiteralExpression,
  sf: ts.SourceFile,
) {
  const init = prop(config, "supportedLocales", sf)?.initializer;
  return init && ts.isArrayLiteralExpression(init)
    ? init.elements.map((e) => stringOf(e as ts.Expression)?.text ?? "")
    : ["en"];
}

function apply(file: string) {
  const input: Record<string, Record<string, Dict>> = JSON.parse(
    readFileSync(file, "utf8"),
  );
  for (const [tenant, byLocale] of Object.entries(input)) {
    const en = readJson(dictPath(tenant, "en"));
    for (const [locale, translations] of Object.entries(byLocale)) {
      const path = dictPath(tenant, locale);
      const merged: Dict = { ...readJson(path), ...translations };
      const unknown = Object.keys(translations).filter((k) => !(k in en));
      if (unknown.length) {
        throw new Error(`${tenant}.${locale}: keys not in English: ${unknown}`);
      }
      // English key order first, then any locale-only leftovers.
      const ordered: Dict = {};
      for (const k of Object.keys(en)) if (k in merged) ordered[k] = merged[k]!;
      for (const k of Object.keys(merged))
        if (!(k in ordered)) ordered[k] = merged[k]!;
      writeJson(path, ordered);
    }
    register(tenant);
  }
}

/** Add the tenant's existing dict files to `appDictionaries` in dicts/index.ts. */
function register(tenant: string) {
  const { sf, config } = parseConfig(tenant);
  const locales = supportedLocales(config, sf).filter((l) =>
    existsSync(dictPath(tenant, l)),
  );
  const q = (s: string) =>
    /^[a-z][a-zA-Z0-9]*$/.test(s) ? s : JSON.stringify(s);
  const line = (l: string) =>
    `    ${q(l)}: () => import("./${tenant}.${l}.json").then((mod) => mod.default),\n`;
  let text = readFileSync(indexPath, "utf8");
  const head = text.indexOf("const appDictionaries = {\n");
  if (head < 0) throw new Error("appDictionaries not found in dicts/index.ts");
  const blockStart = text.indexOf(`\n  ${q(tenant)}: {\n`, head);
  if (blockStart < 0) {
    const at = head + "const appDictionaries = {\n".length;
    text =
      text.slice(0, at) +
      `  ${q(tenant)}: {\n${locales.map(line).join("")}  },\n` +
      text.slice(at);
  } else {
    const blockEnd = text.indexOf("\n  },\n", blockStart) + 1;
    const block = text.slice(blockStart, blockEnd);
    const add = locales.filter((l) => !block.includes(`./${tenant}.${l}.json`));
    text =
      text.slice(0, blockEnd) + add.map(line).join("") + text.slice(blockEnd);
  }
  writeFileSync(indexPath, text);
  prettier(indexPath, ...locales.map((l) => dictPath(tenant, l)));
}

const args = process.argv.slice(2);
if (args[0] === "--apply" && args[1]) {
  apply(args[1]);
} else if (args.length && !args[0]!.startsWith("-")) {
  const out: Record<string, Record<string, Dict>> = {};
  for (const tenant of args) {
    const missing = extract(tenant);
    if (Object.keys(missing).length) out[tenant] = missing;
    else register(tenant);
  }
  console.log(JSON.stringify(out, null, 2));
} else {
  console.error(
    "Usage: tenant-config-i18n.ts <tenant…> | --apply <translations.json>",
  );
  process.exit(1);
}
