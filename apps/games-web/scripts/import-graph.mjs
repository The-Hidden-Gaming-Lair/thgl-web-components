// @ts-check
/**
 * Static import graph of games-web + @repo/ui + @repo/lib, for the deploy purge
 * plan (purge-plan.mjs): which ROUTES render a changed file?
 *
 * Barrels are resolved per imported NAME: `import { fetchDict } from
 * "@repo/lib"` depends on the module that defines fetchDict, not on all 62
 * modules @repo/lib's index re-exports, so a change in one lib module only
 * reaches the routes that use it. Anything the parser can't pin down
 * (namespace / side-effect / dynamic imports, unknown names) depends on the
 * whole target module and everything it re-exports: over-purging is safe,
 * under-purging leaves a stale page for a day.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix } from "node:path";

const SRC_ROOTS = ["apps/games-web/src", "packages/ui/src", "packages/lib/src"];
const EXTS = [".ts", ".tsx", ".mjs", ".js", ".cjs", ".json", ".css"];

/** Package specifier -> repo path (package.json "exports" + tsconfig "@/*"). */
const ALIASES = [
  ["@/", "apps/games-web/src/"],
  ["@repo/lib/server", "packages/lib/src/server/index.ts"],
  ["@repo/lib/overwolf", "packages/lib/src/overwolf/index.ts"],
  ["@repo/lib/thgl-app", "packages/lib/src/thgl-app/index.ts"],
  ["@repo/lib/web-map", "packages/lib/src/web-map/index.ts"],
  ["@repo/lib", "packages/lib/src/index.ts"],
  [
    "@repo/ui/full-map-dynamic",
    "packages/ui/src/components/(dynamic)/full-map-dynamic.tsx",
  ],
  [
    "@repo/ui/markers-search",
    "packages/ui/src/components/(controls)/markers-search.tsx",
  ],
  ["@repo/ui/dicts", "packages/ui/src/dicts/index.ts"],
  ["@repo/ui/styles/globals.css", "packages/ui/src/styles/globals.css"],
  ["@repo/ui/fonts/", "packages/ui/src/fonts/"],
];
const UI_FOLDERS = [
  "ads",
  "apps",
  "controls",
  "content",
  "data",
  "header",
  "interactive-map",
  "peer",
  "providers",
  "desktop",
  "overwolf",
  "thgl-app",
  "tips",
];

/**
 * @typedef {{ spec: string, names: string[] | null, reexport: boolean, star: boolean, alias?: Record<string,string> }} Ref
 *   names null = the whole module (namespace, side effect, dynamic, unknown)
 */

/** @param {string} src */
export function parseModule(src) {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  /** @type {Ref[]} */
  const refs = [];
  /** @type {Set<string>} */
  const defines = new Set();
  // export * from "x" / export * as ns from "x"
  for (const m of code.matchAll(
    /export\s+\*\s*(?:as\s+(\w+)\s*)?from\s*["']([^"']+)["']/g,
  )) {
    if (m[1]) {
      defines.add(m[1]);
      refs.push({ spec: m[2], names: null, reexport: false, star: false });
    } else refs.push({ spec: m[2], names: null, reexport: true, star: true });
  }
  // export { a, b as c } from "x"
  for (const m of code.matchAll(
    /export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g,
  )) {
    /** @type {Record<string,string>} */
    const alias = {};
    for (const part of m[1]
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, ""))
      .filter(Boolean)) {
      const [orig, as] = part.split(/\s+as\s+/).map((s) => s.trim());
      alias[as ?? orig] = orig;
    }
    refs.push({
      spec: m[2],
      names: Object.values(alias),
      reexport: true,
      star: false,
      alias,
    });
  }
  // import ... from "x"
  for (const m of code.matchAll(
    /import\s+(type\s+)?([^"';]*?)\s+from\s*["']([^"']+)["']/g,
  )) {
    const clause = m[2].trim();
    if (/^\*\s*as\s+/.test(clause)) {
      refs.push({ spec: m[3], names: null, reexport: false, star: false });
      continue;
    }
    const names = [];
    const brace = clause.match(/\{([^}]*)\}/);
    if (brace) {
      for (const part of brace[1]
        .split(",")
        .map((s) => s.trim().replace(/^type\s+/, ""))
        .filter(Boolean)) {
        names.push(part.split(/\s+as\s+/)[0].trim());
      }
    }
    const def = clause
      .replace(/\{[^}]*\}/, "")
      .replace(/,/g, "")
      .trim();
    if (def) names.push("default");
    refs.push({
      spec: m[3],
      names: names.length ? names : null,
      reexport: false,
      star: false,
    });
  }
  // side-effect imports, dynamic import(), require()
  for (const m of code.matchAll(/(?:^|[^\w.])import\s*["']([^"']+)["']/g))
    refs.push({ spec: m[1], names: null, reexport: false, star: false });
  for (const m of code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g))
    refs.push({ spec: m[1], names: null, reexport: false, star: false });
  for (const m of code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g))
    refs.push({ spec: m[1], names: null, reexport: false, star: false });
  // local definitions
  for (const m of code.matchAll(
    /export\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|type|interface|enum|abstract\s+class)\s+(\w+)/g,
  ))
    defines.add(m[1]);
  if (/export\s+default\b/.test(code)) defines.add("default");
  for (const m of code.matchAll(
    /export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g,
  )) {
    for (const part of m[1]
      .split(",")
      .map((s) => s.trim().replace(/^type\s+/, ""))
      .filter(Boolean)) {
      const p = part.split(/\s+as\s+/);
      defines.add((p[1] ?? p[0]).trim());
    }
  }
  return { refs, defines };
}

/**
 * @param {{ files: string[], read: (path: string) => string | null }} repo
 *   files: repo-relative paths (forward slashes) of every source file
 */
export function buildGraph({ files, read }) {
  const fileSet = new Set(files);
  /** @param {string} p */
  const probe = (p) => {
    if (fileSet.has(p)) return p;
    for (const e of EXTS) if (fileSet.has(p + e)) return p + e;
    for (const e of EXTS)
      if (fileSet.has(`${p}/index${e}`)) return `${p}/index${e}`;
    return null;
  };
  /** @param {string} spec @param {string} from */
  const resolve = (spec, from) => {
    if (spec.startsWith("."))
      return probe(posix.normalize(posix.join(posix.dirname(from), spec)));
    for (const [prefix, target] of ALIASES) {
      if (
        spec === prefix ||
        (prefix.endsWith("/") && spec.startsWith(prefix))
      ) {
        return probe(
          prefix.endsWith("/") ? target + spec.slice(prefix.length) : target,
        );
      }
    }
    const ui = spec.match(/^@repo\/ui\/([a-z-]+)$/);
    if (ui && UI_FOLDERS.includes(ui[1]))
      return probe(`packages/ui/src/components/(${ui[1]})/index`);
    if (spec.startsWith("@repo/ui/dicts/"))
      return probe(`packages/ui/src/dicts/${spec.slice(15)}`);
    return null; // npm package: outside the graph
  };

  /** @type {Map<string, ReturnType<typeof parseModule>>} */
  const mods = new Map();
  for (const f of files) {
    if (!/\.(m?[jt]sx?|cjs)$/.test(f)) continue;
    const src = read(f);
    if (src != null) mods.set(f, parseModule(src));
  }

  /** Modules that actually define `name` as exported by `file` (follows re-export chains). */
  /** @type {Map<string, string[] | null>} */
  const memo = new Map();
  /** @param {string} file @param {string} name @param {Set<string>} seen @returns {string[] | null} */
  const definers = (file, name, seen = new Set()) => {
    const key = `${file}\0${name}`;
    if (memo.has(key)) return memo.get(key) ?? null;
    if (seen.has(file)) return [];
    seen.add(file);
    const mod = mods.get(file);
    if (!mod) return [file];
    if (mod.defines.has(name)) {
      memo.set(key, [file]);
      return [file];
    }
    /** @type {string[]} */
    const out = [];
    for (const r of mod.refs) {
      if (!r.reexport) continue;
      const target = resolve(r.spec, file);
      if (!target) continue;
      if (r.star) out.push(...(definers(target, name, seen) ?? []));
      else if (r.alias && name in r.alias)
        out.push(...(definers(target, r.alias[name], seen) ?? [target]));
    }
    const res = out.length ? [...new Set(out)] : null;
    memo.set(key, res);
    return res;
  };
  /** Everything a whole-module import pulls in: the module + all it re-exports. */
  /** @param {string} file @param {Set<string>} acc */
  const closure = (file, acc = new Set()) => {
    if (acc.has(file)) return acc;
    acc.add(file);
    for (const r of mods.get(file)?.refs ?? []) {
      if (!r.reexport) continue;
      const t = resolve(r.spec, file);
      if (t) closure(t, acc);
    }
    return acc;
  };

  /** reverse edges: file -> files that depend on it */
  /** @type {Map<string, Set<string>>} */
  const dependents = new Map();
  const edge = (/** @type {string} */ from, /** @type {string} */ to) => {
    if (from === to) return;
    let s = dependents.get(to);
    if (!s) dependents.set(to, (s = new Set()));
    s.add(from);
  };
  for (const [file, mod] of mods) {
    for (const r of mod.refs) {
      const target = resolve(r.spec, file);
      if (!target) continue;
      if (r.reexport) {
        edge(file, target);
        continue;
      } // a barrel depends on what it re-exports
      if (r.names === null) {
        for (const t of closure(target)) edge(file, t);
        continue;
      }
      for (const n of r.names) {
        const defs = definers(target, n);
        if (defs) for (const d of defs) edge(file, d);
        else for (const t of closure(target)) edge(file, t);
      }
    }
  }

  /**
   * Every file that (transitively) depends on `file`, plus the file itself.
   * Named importers of a barrel point at the defining module directly, so
   * walking up through a barrel only reaches whole-module importers of it.
   * @param {string} file
   */
  const reachedFrom = (file) => {
    const seen = new Set([file]);
    const queue = [file];
    while (queue.length) {
      const f = /** @type {string} */ (queue.pop());
      for (const d of dependents.get(f) ?? []) {
        if (!seen.has(d)) {
          seen.add(d);
          queue.push(d);
        }
      }
    }
    return seen;
  };
  return { resolve, reachedFrom, mods, dependents };
}

/** Every source file under the graph roots, repo-relative. @param {string} root */
export function listSourceFiles(root) {
  /** @type {string[]} */
  const out = [];
  const walk = (/** @type {string} */ rel) => {
    const abs = join(root, rel);
    if (!existsSync(abs)) return;
    for (const name of readdirSync(abs)) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const r = `${rel}/${name}`;
      if (statSync(join(abs, name)).isDirectory()) walk(r);
      else out.push(r);
    }
  };
  for (const r of SRC_ROOTS) walk(r);
  return out;
}

/** @param {string} root */
export const fsReader = (root) => (/** @type {string} */ p) => {
  try {
    return readFileSync(join(root, p), "utf8");
  } catch {
    return null;
  }
};
