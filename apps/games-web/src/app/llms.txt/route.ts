import { getStaticDictionary } from "@repo/ui/dicts";
import { getAppConfig } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { notFound } from "next/navigation";

/**
 * llms.txt — a curated markdown index of the tenant for AI agents
 * (https://llmstxt.org/). Complements robots.txt: the training crawlers are
 * blocked there, while on-demand fetch agents (Claude-User, ChatGPT-User) and
 * AI-search indexers use this file to find the canonical entry points instead
 * of crawling the long tail of locale/DB permutations.
 *
 * Content derives from the tenant config + bundled static dicts only (no CDN
 * fetches) so the route is cheap and can never fail on missing game data.
 * The www tenant has its own hub variant at app/www/llms.txt/route.ts.
 */
export async function GET() {
  const config = await getAppConfig();
  // thgl-app is a webview surface for the native client, not indexed.
  if (config.name === "thgl-app") notFound();

  // Some tenants use dict keys (config.internalLinks.*.title) instead of
  // literal titles; resolveDict passes literal strings through unchanged.
  const dict = await getStaticDictionary(config.name, "en");
  const base = `https://${config.domain}.th.gl`;
  // markerOptions ⇒ the tenant ships maps; db-only tenants (e.g. homm) don't.
  const kind = config.markerOptions
    ? config.db
      ? "interactive map and database"
      : "interactive map"
    : "game database";

  const lines: string[] = [
    `# ${config.title}`,
    "",
    `> Community-run ${kind} for ${config.title}, part of The Hidden Gaming Lair (th.gl).`,
    "",
    "## Main",
    "",
    `- [Home](${base}/): ${kind} for ${config.title}`,
  ];

  for (const link of config.internalLinks ?? []) {
    const href = link.href.startsWith("http")
      ? link.href
      : `${base}${link.href}`;
    const title = resolveDict(dict, link.title);
    const description = link.description
      ? resolveDict(dict, link.description)
      : "";
    lines.push(`- [${title}](${href})${description ? `: ${description}` : ""}`);
  }

  // Database sections not already covered by a curated internalLink.
  const linkedHrefs = new Set(
    (config.internalLinks ?? []).map((l) => l.href.replace(/\/$/, "")),
  );
  const homeSections = (config.db?.homeSections ?? []).filter(
    (s) => !linkedHrefs.has(s.href.replace(/\/$/, "")),
  );
  if (homeSections.length > 0) {
    lines.push("", "## Database", "");
    for (const section of homeSections) {
      // resolveDict returns the key itself on a miss (e.g. CDN-only keys
      // absent from the static dict) — fall back to titleFallback then.
      const resolved = section.titleKey
        ? resolveDict(dict, section.titleKey)
        : undefined;
      const label =
        (resolved !== section.titleKey ? resolved : undefined) ??
        section.titleFallback ??
        section.type;
      lines.push(`- [${label}](${base}${section.href})`);
    }
  }

  lines.push(
    "",
    "## Meta",
    "",
    `- [Sitemap](${base}/sitemap.xml)`,
    `- [The Hidden Gaming Lair](https://www.th.gl/): all games and apps`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
