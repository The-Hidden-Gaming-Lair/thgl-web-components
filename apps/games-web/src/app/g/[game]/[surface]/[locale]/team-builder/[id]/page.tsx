import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  damageSkills,
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  multiplier,
  partnersFor,
  rankCounters,
  STAT_KEYS,
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
import {
  fetchTeamBuilderData,
  getTeamBuilderNames,
} from "@/lib/team-builder/data";
import {
  chipFor,
  fmtMult,
  multClass,
  SpeciesIcon,
} from "@/lib/team-builder/parts";

/**
 * Per-Aniimo matchup page (/team-builder/<id>): what it hits hard, what hits
 * it hard, the best counters to it and teammates that cover its weaknesses —
 * server-rendered over the same logic as the builder, so each species is its
 * own indexable page.
 */
type PageProps = { params: Promise<{ locale?: string; id: string }> };

const COUNTERS = 8;

async function load(locale: string, id: string) {
  const appConfig = await getAppConfig();
  const data = await fetchTeamBuilderData(appConfig.name);
  if (!data?.species[id]) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  return { appConfig, data, dict, sp: data.species[id] };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, id } = await params;
  const { appConfig, dict, sp } = await load(locale, id);
  const vars = {
    name: translate(dict, id),
    element: translate(dict, `teambuilder.element.${sp.main}`),
  };
  const title = translate(dict, "tb.entry.metaTitle", { vars });
  const description = translate(dict, "tb.entry.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/team-builder/${id}`,
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
  const { appConfig, data, dict, sp } = await load(locale, id);
  const [version, names] = await Promise.all([
    fetchVersion(appConfig.name),
    getTeamBuilderNames(appConfig.name, data, dict),
  ]);
  const iconsHash = version.more.icons;
  const appName = appConfig.name;
  const byId = new Map(names.species.map((s) => [s.id, s]));
  const info = byId.get(id);
  const name = info?.name ?? id;
  const t = (key: string, vars?: Record<string, string>) =>
    translate(dict, `tb.${key}`, vars ? { vars } : undefined);
  const Chip = chipFor(data, names, appName, iconsHash);
  const elementIds = data.elements.map((e) => e.id);
  const role = sp.role ? (names.roles[sp.role] ?? sp.role) : "";

  const skills = damageSkills(data, id);
  const strong = elementIds
    .map((def) => {
      const best = skills.find((s) => multiplier(data, s.element, def) > 1);
      return best ? { def, skill: best } : undefined;
    })
    .filter((x) => !!x);
  const weakTo = elementIds.filter((a) => multiplier(data, a, sp.main) > 1);
  const resists = elementIds.filter((a) => multiplier(data, a, sp.main) < 1);
  const counters = rankCounters(data, sp.main)
    .filter((c) => c.id !== id)
    .slice(0, COUNTERS);
  const partners = partnersFor(data, id);
  const picks = data.recommended.flatMap((r) =>
    Object.entries(r.roles)
      .filter(([, ids]) => ids.includes(id))
      .map(([ro]) => ({ element: r.element, role: ro })),
  );

  const heading = t("entry.heading", { name });
  const crumbs = [
    { label: t("title"), href: "/team-builder" },
    { label: name },
  ];
  const pageUrl = `https://${appConfig.domain}.th.gl${localizePath(`/team-builder/${id}`, locale)}`;
  const none = <span className="text-muted-foreground">{t("entry.none")}</span>;
  const speciesLink = (sid: string, size = 28) => (
    <Link
      href={localizePath(`/team-builder/${sid}`, locale)}
      className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-accent"
    >
      <SpeciesIcon
        info={byId.get(sid)}
        size={size}
        appName={appName}
        iconsHash={iconsHash}
      />
      <span>{byId.get(sid)?.name ?? sid}</span>
    </Link>
  );
  const section = (title: string, body: React.ReactNode) => (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {body}
    </section>
  );

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
            <SpeciesIcon
              info={info}
              size={64}
              appName={appName}
              iconsHash={iconsHash}
            />
            <div>
              <h2 className="text-2xl">{heading}</h2>
              <p className="text-sm">
                {t("entry.intro", {
                  name,
                  element: names.elements[sp.main] ?? sp.main,
                  role,
                })}
              </p>
            </div>
          </div>
        }
        content={
          <div className="text-left space-y-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1">
                {t("mainElement")}: <Chip id={sp.main} />
              </span>
              {sp.elements.length > 1 && (
                <span className="inline-flex items-center gap-2">
                  {t("affinities")}:
                  {sp.elements.map((e) => (
                    <Chip key={e} id={e} />
                  ))}
                </span>
              )}
              {role && (
                <span>
                  {t("role")}: <b>{role}</b>
                </span>
              )}
              <Link
                className="text-primary hover:underline"
                href={localizePath(`/team-builder?t=${id}`, locale)}
              >
                {t("entry.build", { name })}
              </Link>
              <Link
                className="text-primary hover:underline"
                href={localizePath(`/db/aniimo/${id}`, locale)}
              >
                {t("codex")}
              </Link>
            </div>

            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
              {section(
                t("entry.strongAgainst"),
                strong.length ? (
                  <ul className="space-y-1 text-sm">
                    {strong.map(({ def, skill }) => (
                      <li key={def} className="flex items-center gap-2">
                        <Chip id={def} />
                        <span
                          className={multClass(
                            multiplier(data, skill.element, def),
                            true,
                          )}
                        >
                          {fmtMult(multiplier(data, skill.element, def))}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {names.skills[skill.id] ?? skill.id}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  none
                ),
              )}
              {section(
                t("entry.weakTo"),
                weakTo.length ? (
                  <ul className="space-y-1 text-sm">
                    {weakTo.map((a) => (
                      <li key={a} className="flex items-center gap-2">
                        <Chip id={a} />
                        <span
                          className={multClass(
                            multiplier(data, a, sp.main),
                            false,
                          )}
                        >
                          {fmtMult(multiplier(data, a, sp.main))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  none
                ),
              )}
              {section(
                t("entry.resists"),
                resists.length ? (
                  <ul className="space-y-1 text-sm">
                    {resists.map((a) => (
                      <li key={a} className="flex items-center gap-2">
                        <Chip id={a} />
                        <span
                          className={multClass(
                            multiplier(data, a, sp.main),
                            false,
                          )}
                        >
                          {fmtMult(multiplier(data, a, sp.main))}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  none
                ),
              )}
            </div>

            {section(
              t("entry.counters", { name }),
              <ol className="divide-y rounded-md border">
                {counters.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-3 px-2 py-1 text-sm"
                  >
                    {speciesLink(c.id)}
                    {c.skill && (
                      <span className="text-xs text-muted-foreground">
                        {names.skills[c.skill.id] ?? c.skill.id}
                      </span>
                    )}
                    <span className="ml-auto text-xs">
                      {t("counter.offense")}{" "}
                      <b className={multClass(c.offense, true)}>
                        {fmtMult(c.offense)}
                      </b>{" "}
                      · {t("counter.taken")}{" "}
                      <b className={multClass(c.taken, false)}>
                        {fmtMult(c.taken)}
                      </b>
                    </span>
                  </li>
                ))}
              </ol>,
            )}

            {partners.length > 0 &&
              section(
                t("entry.partners"),
                <ul className="grid gap-1 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
                  {partners.map((p) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      {speciesLink(p.id)}
                      <span className="ml-auto flex gap-1">
                        {p.resists.map((e) => (
                          <Chip key={e} id={e} compact />
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>,
              )}

            {picks.length > 0 &&
              section(
                t("recommended"),
                <ul className="flex flex-wrap gap-3 text-sm">
                  {picks.map((p) => (
                    <li
                      key={`${p.element}|${p.role}`}
                      className="inline-flex items-center gap-2"
                    >
                      <Chip id={p.element} />
                      <span className="text-muted-foreground">
                        {names.roles[p.role] ?? p.role}
                      </span>
                    </li>
                  ))}
                </ul>,
              )}

            {section(
              t("skills"),
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">
                        {t("skill")}
                      </th>
                      <th className="px-2 py-1 text-left font-medium">
                        {t("element")}
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        {t("power")}
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        {t("ep")}
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        {t("cd")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {skills.map((s) => (
                      <tr key={s.id}>
                        <td className="px-2 py-1">
                          <Link
                            href={localizePath(`/db/skills/${s.id}`, locale)}
                            className="hover:text-amber-300"
                          >
                            {names.skills[s.id] ?? s.id}
                          </Link>
                        </td>
                        <td className="px-2 py-1">
                          {s.element && <Chip id={s.element} />}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {s.power ?? ""}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {s.ep ?? ""}
                        </td>
                        <td className="px-2 py-1 text-right tabular-nums">
                          {s.cd ? `${s.cd}s` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>,
            )}

            {section(
              t("baseStats"),
              <dl className="grid grid-cols-5 gap-2 text-center text-sm">
                {STAT_KEYS.map((k, i) => (
                  <div key={k} className="rounded-md border px-1 py-1">
                    <dt className="text-xs text-muted-foreground">
                      {t(`stats.${k}`)}
                    </dt>
                    <dd className="tabular-nums">{sp.stats[i] ?? 0}</dd>
                  </div>
                ))}
              </dl>,
            )}
          </div>
        }
      />
    </HeaderOffset>
  );
}
