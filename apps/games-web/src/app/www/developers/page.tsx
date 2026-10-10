import Link from "next/link";
import { PageShell } from "@/games/thgl-web/components/page-shell";
import { PageHeader } from "@/games/thgl-web/components/page-header";
import {
  CopyBox,
  CreatorKit,
  EmbedFromLink,
  TooltipsDemoLoader,
} from "./developer-tools";

const TITLE = "Embeds & Tooltips for Developers – TH.GL";
const DESCRIPTION =
  "Free interactive game maps and item tooltips for your website, guide or blog. Copy-paste embed code, no sign-up, no API key.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/developers" },
  openGraph: { url: "/developers" },
};

const isDev = process.env.NODE_ENV === "development";

/** Game site origin; the local dev server in development. */
function origin(domain: string): string {
  return isDev ? `http://${domain}.localhost:3100` : `https://${domain}.th.gl`;
}

const SCRIPT_URL = isDev ? "/tooltips.js" : "https://www.th.gl/tooltips.js";

const DEMO_EMBED_SRC = `${origin("palia")}/embed/maps/Kilima%20Village?zoom=1&types=landmark,stable`;

const TOOLTIP_SNIPPET = `<script async src="https://www.th.gl/tooltips.js"></script>`;

const TOOLTIP_CONFIG_SNIPPET = `<script>
  window.thglTooltipsConfig = {
    iconizeLinks: true, // icon in front of each link
    colorLinks: true,   // link colour = item rarity
    renameLinks: false, // replace the link text with the item name
    iconSize: "small",  // "small" or "medium"
    locale: "de",       // language for links without one in the URL
  };
</script>
<script async src="https://www.th.gl/tooltips.js"></script>`;

const DATA_ATTRIBUTE_SNIPPET = `<span data-thgl="https://palworld.th.gl/db/paldeck/pal_badcatgirl">Nyafia</span>`;

const MAP_PARAMS: { name: string; example: string; description: string }[] = [
  {
    name: "center",
    example: "center=-8000,1000",
    description: "Start position (the map's own coordinates).",
  },
  { name: "zoom", example: "zoom=1.5", description: "Start zoom level." },
  {
    name: "types",
    example: "types=landmark,stable",
    description:
      "Only show these marker types. Without it the map's default markers show.",
  },
  {
    name: "hide",
    example: "hide=landmark",
    description: "Show every marker type except these.",
  },
  {
    name: "share",
    example: "share=<share code>",
    description:
      "Add a player's custom filter (their own markers and drawings) by its share code.",
  },
];

const TOOLTIP_DEMO = [
  {
    href: `${origin("palworld")}/db/paldeck/pal_badcatgirl`,
    text: "Nyafia",
    game: "Palworld",
  },
  {
    href: `${origin("diablo4")}/db/uniques/uni_1HAxe_Unique_Druid_100`,
    text: "Waxing Gibbous",
    game: "Diablo IV",
  },
  {
    href: `${origin("gothic1remake")}/db/item/item_it_mw_1h_axe_01`,
    text: "Axe",
    game: "Gothic 1 Remake",
  },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-20">
      <h2 className="text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function DevelopersPage() {
  return (
    <PageShell className="space-y-12 max-w-4xl mx-auto text-left">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: TITLE,
            description: DESCRIPTION,
            url: "https://www.th.gl/developers",
          }).replace(/</g, "\\u003c"),
        }}
      />
      <PageHeader
        title="Embeds & Tooltips"
        description="Put our interactive maps and item tooltips on your website, guide, blog, video or stream. Free, no sign-up, no API key."
      />
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Embeds & Tooltips</li>
        </ol>
      </nav>

      <Section id="maps" title="Embed an interactive map">
        <p className="text-neutral-300">
          Every map on TH.GL can be embedded: markers, tooltips, zoom and pan,
          without our menus or ads. The easiest way: open the map on its game
          site, set it up the way you want, then open{" "}
          <strong>⋯ (More) → Embed this map</strong> in the map controls, or
          right-click the map. Players can also embed their own custom filters
          and drawings from <strong>My Filters → Embed on a website</strong>.
        </p>
        <iframe
          src={DEMO_EMBED_SRC}
          title="Palia Kilima Village Interactive Map"
          width="100%"
          height={420}
          loading="lazy"
          allowFullScreen
          className="rounded-lg border-0"
        />
        <p className="text-sm text-neutral-400">
          Live demo: Palia, Kilima Village with landmarks and stables.
        </p>
        <h3 className="text-lg font-semibold">From a map link</h3>
        <EmbedFromLink example="https://palia.th.gl/maps/Kilima%20Village?zoom=1&types=landmark,stable" />
        <h3 className="text-lg font-semibold">URL format</h3>
        <p className="text-neutral-300">
          <code className="text-amber-400">
            https://&lt;game&gt;.th.gl/[language/]embed/maps/&lt;Map
            name&gt;?parameters
          </code>{" "}
          - the same address as the map page with{" "}
          <code className="text-amber-400">/embed</code> in front of{" "}
          <code className="text-amber-400">/maps</code>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4">Parameter</th>
                <th className="py-2 pr-4">Example</th>
                <th className="py-2">What it does</th>
              </tr>
            </thead>
            <tbody>
              {MAP_PARAMS.map((param) => (
                <tr key={param.name} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono text-amber-400">
                    {param.name}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">
                    {param.example}
                  </td>
                  <td className="py-2 text-neutral-300">{param.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-400">
          You don&apos;t need to look up marker type ids: the embed dialog on
          every map writes them for you. Keep the link under the map: it is how
          readers find the full map, and the only thing we ask in return.
        </p>
      </Section>

      <Section id="creators" title="Creator kit for YouTube and Twitch">
        <p className="text-neutral-300">
          Making videos or streams about a game we cover? Paste the map you
          show, add your channel name, and copy the blocks: description links, a
          chat command, an embed for your website and an OBS browser source to
          put the map on stream. Every link carries your own{" "}
          <code className="text-amber-400">?ref=</code> tag.
        </p>
        <CreatorKit example="https://palia.th.gl/maps/Kilima%20Village" />
      </Section>

      <Section id="tooltips" title="Tooltips for item and codex links">
        <p className="text-neutral-300">
          Add one line to your page and every link to a TH.GL database entry
          shows a tooltip with icon, name, type, description and key stats when
          readers hover it. Your links stay normal links to our database pages.
        </p>
        <CopyBox code={TOOLTIP_SNIPPET} label="Tooltip script" />
        <TooltipsDemoLoader src={SCRIPT_URL} />
        <div className="rounded-lg border border-border bg-neutral-950 p-4 text-neutral-300">
          <p className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
            Live demo - hover the links
          </p>
          <ul className="space-y-1">
            {TOOLTIP_DEMO.map((link) => (
              <li key={link.href}>
                {link.game}:{" "}
                <a href={link.href} className="underline">
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <h3 className="text-lg font-semibold">Options</h3>
        <p className="text-neutral-300">
          Set them before the script. All are optional; without them you get the
          tooltips only.
        </p>
        <CopyBox code={TOOLTIP_CONFIG_SNIPPET} label="Tooltip options" />
        <p className="text-neutral-300">
          Links work in any language the game site has (
          <code className="text-amber-400">/de/db/…</code>). For elements that
          are not links, add a <code className="text-amber-400">data-thgl</code>{" "}
          attribute with the entry&apos;s address:
        </p>
        <CopyBox code={DATA_ATTRIBUTE_SNIPPET} label="data-thgl example" />
        <p className="text-sm text-neutral-400">
          Content added later (single-page apps, infinite scroll) is picked up
          automatically; call{" "}
          <code className="text-amber-400">window.thglTooltips.refresh()</code>{" "}
          to force a rescan. The script sets no cookies and does no tracking.
        </p>
      </Section>

      <Section id="wikis" title="Wikis">
        <p className="text-neutral-300">
          Fandom and wiki.gg do not allow outside iframes or scripts. A plain
          link to the map or the database entry works everywhere.
        </p>
      </Section>

      <Section id="terms" title="Terms">
        <ul className="list-disc space-y-1 pl-5 text-neutral-300">
          <li>
            Free for any website, including commercial ones. No sign-up, no key.
          </li>
          <li>
            Keep the visible link to TH.GL under embedded maps and do not hide
            or change our tooltips.
          </li>
          <li>
            Provided as is, without warranty. Parameters may change; we keep old
            links working where we can.
          </li>
          <li>
            Game names, images and data belong to their respective owners.
          </li>
        </ul>
        <p className="text-neutral-300">
          Questions or ideas? Ask in{" "}
          <a href="/discord" className="underline hover:text-amber-400">
            our Discord
          </a>
          .
        </p>
      </Section>
    </PageShell>
  );
}
