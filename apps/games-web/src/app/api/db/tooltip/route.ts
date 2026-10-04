import { NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  fetchDatabaseEntry,
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchVersion,
  getIconsUrl,
  localizePath,
  resolveForgeUrl,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { clipDescription, formatBool, getSectionLabels } from "@/lib/db/seo";

/**
 * Public, CORS-enabled codex tooltip — the data behind www.th.gl/tooltips.js
 * (third-party sites hovering a plain `https://<game>.th.gl/[locale/]db/<section>/<id>`
 * link). The game is resolved from the request host, `section` + `id` are the
 * two path segments of that URL. Returns a SMALL, STABLE shape — external sites
 * depend on it, so only ever add optional fields:
 *
 *   { name, section, icon, description, stats[{label,value}], url, game, rarity? }
 *
 * `icon` is a sprite crop ({url,x,y,width,height}, absolute url) or null — the
 * codex icons are packed into one sheet per game, there is no per-entry file.
 *
 * Our own site's hover cards use the HoMM-flavoured /api/db/entity-tooltip
 * (keyed by id only); this route mirrors the /db/<section>/<id> page instead.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Caching: deliberately NOT set here — next.config.js `headers()` wins over a
// route handler's Cache-Control, and its blanket pageCache rule is exactly the
// codex-page budget we want (edge 1 day, purged when data-forge ships; browser
// revalidates so a pruned icon-sheet hash never sticks). The script caches
// per page view on top.

const MAX_STATS = 6;
const MAX_DESC = 300;

// Props rendered as dedicated sections on the detail page (or structural) —
// never a stat row. Mirrors GenericEntityView's exclusions.
const NON_STAT_KEYS = new Set([
  "region",
  "regionId",
  "category",
  "categoryId",
  "locations",
  "embeddedMap",
  "upgradeTable",
  "rarityTiers",
  "soldBy",
  "sells",
  "rarity",
  "craftable",
  "drops",
  "droppedBy",
  "ingredients",
  "usedToCraft",
  "variants",
  "areas",
  "Category",
  "icon",
]);

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS });
}

const notFoundJson = () => json({ error: "Not found" }, 404);

const humanizeKey = (k: string) =>
  k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const toPlain = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

function isSprite(v: unknown): v is IconSprite {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as IconSprite).url === "string" &&
    typeof (v as IconSprite).width === "number"
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const appConfig = await getAppConfig();
  const db = appConfig.db;
  if (!db) return notFoundJson();

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") ?? "";
  const id = searchParams.get("id") ?? "";
  const requested = searchParams.get("locale") ?? DEFAULT_LOCALE;
  const locale = appConfig.supportedLocales.includes(requested)
    ? requested
    : DEFAULT_LOCALE;
  if (!section || !id) {
    return json({ error: "Missing section or id" }, 400);
  }

  // Same section resolution as /db/[section]/[id] — incl. old per-category
  // slugs folded into a parent section via extraTypes (the page 308s those).
  const secCfg =
    db.homeSections.find(
      (s) => s.href === `/db/${section}` || s.type === section,
    ) ?? db.homeSections.find((s) => (s.extraTypes ?? []).includes(section));
  if (!secCfg) return notFoundJson();
  const sectionSlug = secCfg.href.replace(/^\/db\//, "");
  const types = [secCfg.type, ...(secCfg.extraTypes ?? [])];

  try {
    const [index, dict, version] = await Promise.all([
      fetchDatabaseIndex(appConfig.name),
      getFullDbDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);
    const cat =
      index.find(
        (c) => types.includes(c.type) && c.items.some((i) => i.id === id),
      ) ?? index.find((c) => c.items.some((i) => i.id === id));
    if (
      !cat ||
      (!types.includes(cat.type) &&
        !(secCfg.typePrefix && cat.type.startsWith(secCfg.typePrefix)))
    ) {
      return notFoundJson();
    }
    const indexItem = cat.items.find((i) => i.id === id)!;
    let item: typeof indexItem | null | undefined = null;
    if ((cat as { entries?: boolean }).entries) {
      item = await fetchDatabaseEntry(appConfig.name, cat.type, id);
    }
    if (!item) {
      const full = await fetchDatabaseType(appConfig.name, cat.type);
      item = full.items.find((i) => i.id === id);
    }
    if (!item) return notFoundJson();

    const name = resolveDict(dict, id) || id;
    const { singular } = getSectionLabels(appConfig, dict, secCfg, sectionSlug);
    const props = (item.props ?? {}) as Record<string, unknown>;
    // The entry's sub-group (e.g. a Pal's element), shown beside the section.
    const groupId = (item as { groupId?: string }).groupId;
    const groupRaw = groupId ? resolveDict(dict, groupId) : "";
    const groupLabel =
      groupRaw && groupRaw !== groupId && groupRaw !== singular ? groupRaw : "";

    // Icon: per-entry files omit it, the index always carries it.
    const rawIcon = isSprite(item.icon)
      ? item.icon
      : isSprite(indexItem.icon)
        ? indexItem.icon
        : null;
    let icon: IconSprite | null = null;
    if (rawIcon) {
      let url = rawIcon.url;
      if (!/^https?:\/\//.test(url)) {
        url = await resolveForgeUrl(
          getIconsUrl(appConfig.name, url, version.more.icons),
        );
      }
      if (url.startsWith("/")) url = new URL(url, request.url).toString();
      icon = {
        url,
        x: rawIcon.x,
        y: rawIcon.y,
        width: rawIcon.width,
        height: rawIcon.height,
      };
    }

    // Description: the entry's text, else its longest prose prop (a unique's
    // power, an item's effect) — same pick as the page's meta description.
    const rawDesc = resolveDict(dict, `${id}_desc`);
    let text =
      rawDesc && rawDesc !== `${id}_desc` && rawDesc !== id ? rawDesc : "";
    const prose = Object.entries(props)
      .filter(
        ([k, v]) =>
          !k.startsWith("_") && typeof v === "string" && v.length > 40,
      )
      .map(([, v]) => v as string)
      .sort((a, b) => b.length - a.length)[0];
    if (!text || (prose && /^["“„«]/.test(text))) text = prose ?? text;
    const description = text ? clipDescription(toPlain(text), MAX_DESC) : null;

    // Stats: short scalar props, the stat cards of the detail page.
    const stats: { label: string; value: string }[] = [];
    for (const [k, v] of Object.entries(props)) {
      if (stats.length >= MAX_STATS) break;
      if (k.startsWith("_") || NON_STAT_KEYS.has(k)) continue;
      if (typeof v === "string" && v === text) continue;
      if (
        typeof v === "number" ||
        typeof v === "boolean" ||
        (typeof v === "string" && v.length > 0 && v.length <= 24)
      ) {
        stats.push({
          label: humanizeKey(k),
          value:
            typeof v === "boolean" ? formatBool(dict, v) : toPlain(String(v)),
        });
      }
    }

    const rarity =
      props.rarity &&
      typeof props.rarity === "object" &&
      typeof (props.rarity as { label?: unknown }).label === "string" &&
      typeof (props.rarity as { color?: unknown }).color === "string"
        ? (props.rarity as { label: string; color: string })
        : undefined;

    return json(
      {
        name,
        section: groupLabel ? `${singular} · ${groupLabel}` : singular,
        icon,
        description,
        stats,
        url: `https://${appConfig.domain}.th.gl${localizePath(`/db/${sectionSlug}/${encodeURIComponent(id)}`, locale)}`,
        game: appConfig.title,
        ...(rarity
          ? { rarity: { label: rarity.label, color: rarity.color } }
          : {}),
      },
      200,
    );
  } catch {
    return json({ error: "Unavailable" }, 502);
  }
}
