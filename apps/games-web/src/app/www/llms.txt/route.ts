import { games } from "@repo/lib";

/**
 * llms.txt for the www.th.gl hub (https://llmstxt.org/) — the ecosystem
 * index: main site sections plus every game with its tenant URL. Per-game
 * tenants serve their own llms.txt from app/llms.txt/route.ts; www requests
 * are rewritten to app/www/* by the proxy, so the hub needs this variant.
 */
export function GET() {
  const lines: string[] = [
    "# The Hidden Gaming Lair",
    "",
    "> Interactive maps, databases and in-game companion apps for many games. " +
      "Community-run by one developer; each game lives on its own subdomain.",
    "",
    "## Main",
    "",
    "- [Home](https://www.th.gl/): overview of all games and apps",
    "- [Apps](https://www.th.gl/apps): all interactive maps and database apps",
    "- [Companion App](https://www.th.gl/companion-app): the in-game overlay app with live tracking",
    "- [FAQ](https://www.th.gl/faq): frequently asked questions",
    "- [Blog](https://www.th.gl/blog): release notes and announcements",
    "- [Status](https://www.th.gl/status): live service status",
    "",
    "## Games",
    "",
  ];

  for (const game of games) {
    if (!game.web) continue;
    lines.push(`- [${game.title}](${game.web}/)`);
  }

  lines.push(
    "",
    "## Meta",
    "",
    "- [Sitemap](https://www.th.gl/sitemap.xml)",
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
