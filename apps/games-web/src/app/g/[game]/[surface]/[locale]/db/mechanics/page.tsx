import { type Metadata } from "next";
import { DEFAULT_LOCALE, getMetadataAlternates } from "@repo/lib";
import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { JSONLDScript } from "@repo/ui/apps";
import { requireApp } from "@/lib/get-app-config";

const GAME_TITLE = "Heroes of Might & Magic: Olden Era";

type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const title = `Game Mechanics | ${GAME_TITLE}`;
  const description = `Learn how combat stats, luck, morale, and other mechanics work in ${GAME_TITLE}.`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/db/mechanics",
    locale,
    appConfig.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical },
  };
}

const stats = [
  {
    name: "Attack",
    color: "text-red-400",
    desc: "The hero increases the Attack of all creatures in their army by the value of their own Attack attribute. This bonus directly affects the Damage those creatures deal in battle.",
  },
  {
    name: "Defense",
    color: "text-blue-400",
    desc: "The hero increases the Defense of all creatures in their army by the value of their own Defense attribute. This reduces the Damage those creatures take in battle.",
  },
  {
    name: "Spell Power",
    color: "text-purple-400",
    desc: "Enhances the strength of the hero's spells, increasing both their Damage and the duration of applied effects.",
  },
  {
    name: "Knowledge",
    color: "text-cyan-400",
    desc: "Increases the hero's maximum mana by 10 for each point of Knowledge (formerly called Intelligence in earlier HoMM titles).",
  },
];

const unitStats = [
  {
    name: "Health",
    color: "text-green-400",
    desc: "Total hit points for each creature in the stack. When a creature's HP reaches 0, it dies. Only the top creature in a stack can be partially damaged.",
  },
  {
    name: "Attack & Defense",
    color: "text-red-400",
    desc: "The damage modifier is (20 + attacker's Attack) / (20 + target's Defense). Higher Attack vs. Defense multiplies the dealt damage; higher Defense divides it. Defense can never make a unit invulnerable.",
  },
  {
    name: "Damage",
    color: "text-orange-400",
    desc: "The range of base damage each creature deals per attack (e.g. 50–75). Final damage is multiplied by the Attack/Defense formula above.",
  },
  {
    name: "Initiative",
    color: "text-yellow-400",
    desc: "Determines the turn order in battle. The higher it is, the earlier the stack acts.",
  },
  {
    name: "Speed",
    color: "text-amber-400",
    desc: "Determines the stack's movement range in battle. The higher it is, the farther they can move. It is also a secondary parameter affecting turn order.",
  },
  {
    name: "Value",
    color: "text-slate-300",
    desc: "The AI value of each creature, used for army strength calculations and balancing encounters on the adventure map.",
  },
];

const battleMechanics = [
  {
    name: "Luck",
    icon: "🍀",
    desc: "By default, every point of Luck above zero grants a 6% chance to deal 150% Damage (Lucky Strike). Every point below zero grants a 6% chance to deal 50% Damage (Unlucky Strike). The default hero range is –5 to +5; each creature has its own minimum and maximum Luck based on its type and traits.",
  },
  {
    name: "Morale",
    icon: "⚡",
    desc: "By default, every point of Morale above zero grants a 4% chance to take an extra turn. Every point below zero grants a 4% chance to skip a turn. The default hero range is –5 to +5; each creature has its own minimum and maximum Morale. Armies with creatures from many factions take morale penalties (1 faction: +1, 2: +0, 3: −1, 4: −2, 5: −3, 6: −4, 7: −5).",
  },
  {
    name: "Retaliation",
    icon: "🔄",
    desc: "Standard Melee Attacks provoke counterattacks. Some units have a 'no counterattack' melee attack so enemies do not counterattack. Ranged units, when attacked in melee, switch to a weaker melee attack — and their retaliation also uses that weaker attack.",
  },
  {
    name: "Ranged Attacks",
    icon: "🏹",
    desc: "Ranged units can attack at any range, but suffer two penalties. Melee penalty: when forced to attack in melee (adjacent), they deal 50% less Damage (–50%), and their retaliation uses that weaker attack too. Distance penalty: targets more than 4 hexes away take –10% Damage for each additional hex, capped at 5 hexes (–50% maximum). The two penalties don't stack — melee range uses the flat –50%. Some ranged units (e.g. 'no_close' or 'no_range' variants) avoid one or both penalties.",
  },
  {
    name: "Magic Schools",
    icon: "✦",
    desc: "Spells belong to schools (Day, Night, Primal, Space, and Neutral). Heroes learn spells from Magic Guilds or through skills. Spell effectiveness scales with Spell Power. The Magic Guild in each town offers spells based on the town type.",
  },
];

export default async function MechanicsPage() {
  const appConfig = await requireApp("homm-olden-era");
  const baseUrl = `https://${appConfig.domain}.th.gl`;
  return (
    <>
      <JSONLDScript
        json={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Game Mechanics | ${GAME_TITLE}`,
          name: "Game Mechanics",
          description: `Learn how combat stats, luck, morale, and other mechanics work in ${GAME_TITLE}.`,
          url: `${baseUrl}/db/mechanics`,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${baseUrl}/db/mechanics`,
          },
          isPartOf: {
            "@type": "WebSite",
            name: `${GAME_TITLE} Database — The Hidden Gaming Lair`,
            url: baseUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "The Hidden Gaming Lair",
            url: "https://www.th.gl",
          },
        }}
      />
      <HeaderOffset full>
        <ContentLayout
          id={appConfig.name}
          header={null}
          content={
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  Game Mechanics
                </h1>
                <p className="text-muted-foreground">
                  How combat stats, luck, morale, and other systems work in{" "}
                  {GAME_TITLE}.
                </p>
              </div>

              <section id="hero-stats">
                <h2 className="text-lg font-semibold mb-3 text-amber-400">
                  Hero Stats
                </h2>
                <div className="space-y-2">
                  {stats.map((s) => (
                    <div
                      key={s.name}
                      className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                    >
                      <h3 className={`font-medium ${s.color}`}>{s.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="unit-stats">
                <h2 className="text-lg font-semibold mb-3 text-amber-400">
                  Unit Stats
                </h2>
                <div className="space-y-2">
                  {unitStats.map((s) => (
                    <div
                      key={s.name}
                      className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                    >
                      <h3 className={`font-medium ${s.color}`}>{s.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="battle-mechanics">
                <h2 className="text-lg font-semibold mb-3 text-amber-400">
                  Battle Mechanics
                </h2>
                <div className="space-y-2">
                  {battleMechanics.map((m) => (
                    <div
                      key={m.name}
                      className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4"
                    >
                      <h3 className="font-medium">
                        <span className="mr-2">{m.icon}</span>
                        {m.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {m.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="damage-formula">
                <h2 className="text-lg font-semibold mb-3 text-amber-400">
                  Damage Formula
                </h2>
                <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Base damage is rolled between the unit&apos;s min and max
                    damage values, then multiplied by the number of creatures in
                    the stack and by an Attack/Defense ratio modifier.
                  </p>
                  <div className="bg-black/30 rounded p-3 font-mono text-sm space-y-1">
                    <div>
                      Final Damage = Base Damage × Stack Size × (20 + ATK) / (20
                      + DEF)
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The ratio scales smoothly: equal Attack and Defense leaves
                    damage unchanged, more Attack than Defense multiplies it,
                    more Defense than Attack divides it. Defense can never
                    reduce the modifier to zero, so no unit is fully
                    invulnerable.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      <span className="text-amber-500">&#x25C6;</span> Lucky
                      Strike: +50% damage
                    </li>
                    <li>
                      <span className="text-amber-500">&#x25C6;</span> Unlucky
                      Strike: –50% damage
                    </li>
                    <li>
                      <span className="text-amber-500">&#x25C6;</span> Native
                      Terrain bonus applies when fighting on matching terrain
                    </li>
                  </ul>
                </div>
              </section>
            </div>
          }
        />
      </HeaderOffset>
    </>
  );
}

// Cached in Next's page cache (cache-handler.cjs): rendered once per pod and
// game data version, then served without re-rendering — see
// src/lib/route-params.ts. No dynamic APIs below this route; plain fetches stay
// uncached so a re-render after a data update always sees fresh data.
export const dynamic = "force-static";
export const fetchCache = "default-no-store";
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}
