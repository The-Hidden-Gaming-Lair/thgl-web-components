import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  evolutionBranch,
  evolutionCost,
  evolutionLineOf,
  evolutionPath,
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  translate,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { breadcrumbJsonLd } from "@/lib/db/json-ld";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import {
  evoLabel,
  fetchEvolutionsData,
  getEvolutionNames,
  speciesMapHref,
} from "@/lib/evolutions/data";
import {
  EVO_LINK,
  EvolutionTree,
  Requirements,
  SpeciesChip,
  type EvoCtx,
} from "@/lib/evolutions/parts";

/**
 * Per-Aniimo evolution page (/evolutions/<id>): how to get it (every step
 * from the line's first stage with its requirements and the total cost),
 * what it evolves into, the whole line as a tree and a map link for every
 * stage. Server-rendered, one indexable page per species.
 */
type PageProps = { params: Promise<{ locale?: string; id: string }> };

async function load(locale: string, id: string) {
  const appConfig = await getAppConfig();
  const data = await fetchEvolutionsData(appConfig.name);
  if (!data?.species[id]) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  return { appConfig, data, dict };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, id } = await params;
  const { appConfig, dict } = await load(locale, id);
  const vars = { name: resolveDict(dict, id) || id };
  const title = translate(dict, "evo.entry.metaTitle", { vars });
  const description = translate(dict, "evo.entry.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/evolutions/${id}`,
    locale,
    appConfig.supportedLocales,
  );
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: ["/opengraph-image.jpg"],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale = DEFAULT_LOCALE, id } = await params;
  const { appConfig, data, dict } = await load(locale, id);
  const appName = appConfig.name;
  const version = await fetchVersion(appName);
  const names = await getEvolutionNames(appName, data, dict);
  const label = evoLabel(dict);
  const ctx: EvoCtx = {
    data,
    names,
    dict,
    label,
    appName,
    iconsHash: version.more.icons,
    locale,
  };
  const sp = data.species[id];
  const nameOf = (sid: string) => names.species[sid]?.name ?? sid;
  const name = nameOf(id);
  const line = evolutionLineOf(data, id);
  const path = evolutionPath(data, id);
  const cost = evolutionCost(data, id);
  const stages = line?.species ?? [id];
  const mapHrefs = await Promise.all(
    stages.map((sid) => speciesMapHref(appName, sid, version, locale)),
  );

  const intro = !line
    ? label("entry.introSingle", { name })
    : sp.from.length
      ? label("entry.introFrom", {
          name,
          from: sp.from.map(nameOf).join(", "),
          level: String(evolutionBranch(data, sp.from[0], id)?.level ?? "?"),
        })
      : label("entry.introRoot", {
          name,
          into: sp.evolutions.map((b) => nameOf(b.to)).join(", "),
        });
  const heading = label("entry.heading", { name });
  const crumbs = [
    { label: label("title"), href: "/evolutions" },
    { label: name },
  ];
  const pageUrl = `https://${appConfig.domain}.th.gl${localizePath(`/evolutions/${id}`, locale)}`;
  const section = (title: string, body: React.ReactNode) => (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {body}
    </section>
  );
  const desc = (key?: string) =>
    key ? (
      <p className="text-sm italic text-muted-foreground">
        {resolveDict(dict, key)}
      </p>
    ) : null;

  return (
    <HeaderOffset full>
      <JSONLDScript
        json={breadcrumbJsonLd({
          appConfig,
          homeLabel: dict["ui.nav_home"] || "Home",
          crumbs,
          url: pageUrl,
          locale,
        })}
      />
      <PageTitle title={heading} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appName}
        header={
          <div className="flex items-center justify-center gap-3">
            {names.species[id]?.icon && (
              <SpriteIcon
                icon={names.species[id].icon!}
                appName={appName}
                iconsHash={version.more.icons}
                size={64}
              />
            )}
            <div>
              <h2 className="text-2xl">{heading}</h2>
              <p className="text-sm">{intro}</p>
            </div>
          </div>
        }
        content={
          <div className="text-left space-y-6">
            {path.length > 1 &&
              section(
                label("entry.howTo", { name }),
                <>
                  <ol className="space-y-3">
                    {path.slice(1).map((to, i) => {
                      const from = path[i];
                      const b = evolutionBranch(data, from, to);
                      return (
                        <li
                          key={to}
                          className="space-y-2 rounded-md border border-slate-800 bg-slate-900/40 p-2"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <SpeciesChip id={from} ctx={ctx} size={32} />
                            <span aria-hidden>→</span>
                            <SpeciesChip
                              id={to}
                              ctx={ctx}
                              size={32}
                              current={to === id}
                            />
                          </div>
                          {b && <Requirements branch={b} ctx={ctx} />}
                        </li>
                      );
                    })}
                  </ol>
                  <p className="text-sm">
                    {label("entry.total", {
                      steps: String(cost.steps),
                      root: nameOf(path[0]),
                      level: String(cost.level ?? "?"),
                    })}
                    {cost.items.length > 0 &&
                      ` ${cost.items
                        .map(
                          (it) =>
                            `${names.items[it.id]?.name ?? it.id} ×${it.count}`,
                        )
                        .join(", ")}`}
                  </p>
                </>,
              )}
            {section(
              label("entry.evolvesInto", { name }),
              sp.evolutions.length ? (
                <ul className="space-y-3">
                  {sp.evolutions.map((b) => (
                    <li
                      key={b.to}
                      className="space-y-2 rounded-md border border-slate-800 bg-slate-900/40 p-2"
                    >
                      <SpeciesChip id={b.to} ctx={ctx} />
                      {desc(b.desc)}
                      <Requirements branch={b} ctx={ctx} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {line
                    ? label("entry.final", { name })
                    : label("entry.introSingle", { name })}
                </p>
              ),
            )}
            {line &&
              section(
                label("entry.line"),
                <EvolutionTree id={line.id} ctx={ctx} current={id} />,
              )}
            {section(
              label("entry.where"),
              <ul className="space-y-2">
                {stages.map((sid, i) => (
                  <li key={sid} className="flex flex-wrap items-center gap-3">
                    <SpeciesChip
                      id={sid}
                      ctx={ctx}
                      size={32}
                      current={sid === id}
                    />
                    {mapHrefs[i] ? (
                      <Link href={mapHrefs[i]!} className={EVO_LINK}>
                        {label("entry.onMap", { name: nameOf(sid) })}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {label("entry.notWild")}
                      </span>
                    )}
                    <Link
                      href={localizePath(`/db/aniimo/${sid}`, locale)}
                      className={EVO_LINK}
                    >
                      {label("entry.codex")}
                    </Link>
                  </li>
                ))}
              </ul>,
            )}
            <p className="text-sm">
              <Link
                href={localizePath(`/team-builder/${id}`, locale)}
                className={EVO_LINK}
              >
                {label("entry.matchups", { name })}
              </Link>
            </p>
          </div>
        }
      />
    </HeaderOffset>
  );
}
