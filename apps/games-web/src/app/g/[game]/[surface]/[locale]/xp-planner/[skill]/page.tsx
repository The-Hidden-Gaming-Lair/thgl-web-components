import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  actionsNeeded,
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  methodsForSkill,
  translate,
  trainableSkills,
  xpForLevel,
  XP_PLANNER_PATH,
  PER_DAMAGE_UNIT,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { JSONLDScript } from "@repo/ui/apps";
import { ContentLayout } from "@repo/ui/ads";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { getAppConfig } from "@/lib/get-app-config";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { breadcrumbJsonLd } from "@/lib/db/json-ld";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import {
  loadXpPlanner,
  skillName,
  xpDict,
  xpLabels,
  xpPayload,
} from "@/lib/xp-planner/data";
import { XpPlanner } from "@/lib/xp-planner/planner";
import { FlagBadge, xpPerUnit, xpT } from "@/lib/xp-planner/parts";

/**
 * Per-skill XP page (/xp-planner/<skill>): the planner preset to the skill,
 * plus server-rendered best methods (actions from level 1 to max) and the XP
 * table — each skill is its own indexable "<Game> <Skill> XP calculator".
 */
type PageProps = { params: Promise<{ locale?: string; skill: string }> };

const TOP = 20;

async function load(locale: string, skill: string) {
  const appConfig = await getAppConfig();
  const config = await loadXpPlanner(appConfig);
  if (!config || !trainableSkills(config).some((s) => s.id === skill)) {
    notFound();
  }
  const dict = xpDict(
    config,
    await getFullDbDictionary(appConfig.name, locale),
    locale,
  );
  return { appConfig, config, dict, name: skillName(config, dict, skill) };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, skill } = await params;
  const { appConfig, config, dict, name } = await load(locale, skill);
  const max = config.curve.length;
  const vars = {
    title: appConfig.title,
    skill: name,
    count: String(methodsForSkill(config, skill).length),
    max: String(max),
    xp: xpForLevel(config.curve, max).toLocaleString(locale),
  };
  const title = translate(dict, "xp.skillMetaTitle", { vars });
  const description = translate(dict, "xp.skillMetaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `${XP_PLANNER_PATH}/${skill}`,
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
  const { locale = DEFAULT_LOCALE, skill } = await params;
  const { appConfig, config, dict, name } = await load(locale, skill);
  const version = await fetchVersion(appConfig.name);
  const payload = await xpPayload(appConfig, config, dict, version);
  const labels = xpLabels(dict);
  const t = xpT(labels);
  const max = config.curve.length;
  const total = xpForLevel(config.curve, max);
  const methods = payload.methods
    .filter((m) => m.skill === skill)
    .sort((a, b) => b.xp - a.xp || a.id.localeCompare(b.id));
  const perAction = methods.filter((m) => m.unit !== PER_DAMAGE_UNIT);
  const top = (perAction.length ? perAction : methods).slice(0, TOP);
  const vars = {
    title: appConfig.title,
    skill: name,
    count: methods.length.toLocaleString(locale),
    max: String(max),
    xp: total.toLocaleString(locale),
  };
  const heading = translate(dict, "xp.skillHeading", { vars });
  const crumbs = [
    { label: translate(dict, "xp.title"), href: XP_PLANNER_PATH },
    { label: name },
  ];
  const url = `https://${appConfig.domain}.th.gl${localizePath(`${XP_PLANNER_PATH}/${skill}`, locale)}`;
  const levelRows = config.curve.map((xp, i) => ({ level: i + 1, xp }));
  const cols = 3;
  const perCol = Math.ceil(levelRows.length / cols);

  return (
    <HeaderOffset full>
      <JSONLDScript
        json={breadcrumbJsonLd({
          appConfig,
          homeLabel: dict["ui.nav_home"] || "Home",
          crumbs,
          url,
          locale,
        })}
      />
      <PageTitle title={heading} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{heading}</h2>
            <p className="text-sm">
              {translate(dict, "xp.skillIntro", { vars })}
            </p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <XpPlanner
              labels={labels}
              appName={appConfig.name}
              locale={locale}
              basePath={XP_PLANNER_PATH}
              initialSkill={skill}
            />

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "xp.bestMethods", { vars })}
              </h2>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">
                        {t("method")}
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        {t("xpEach")}
                      </th>
                      <th className="px-2 py-1 text-right font-medium">
                        {t("actionsTo", { max })}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {top.map((m) => {
                      const n = actionsNeeded(total, m.xp);
                      return (
                        <tr key={m.id}>
                          <td className="px-2 py-1">
                            <span className="inline-flex min-w-0 items-center gap-2">
                              {m.icon ? (
                                <SpriteIcon
                                  icon={m.icon}
                                  appName={appConfig.name}
                                  iconsHash={payload.iconsHash}
                                  size={24}
                                />
                              ) : null}
                              {m.db ? (
                                <Link
                                  href={localizePath(m.db, locale)}
                                  prefetch={false}
                                  className="hover:text-amber-300"
                                >
                                  {m.name}
                                </Link>
                              ) : (
                                <span>{m.name}</span>
                              )}
                              <FlagBadge flag={m.flag} labels={labels} />
                            </span>
                          </td>
                          <td className="px-2 py-1 text-right text-xs text-muted-foreground">
                            {xpPerUnit(t, m.xp, m.unit, locale)}
                          </td>
                          <td className="px-2 py-1 text-right font-mono tabular-nums">
                            {Number.isFinite(n)
                              ? n.toLocaleString(locale)
                              : "–"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "xp.xpTable", { vars })}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: cols }, (_, c) => (
                  <table key={c} className="w-full rounded-md border text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1 text-left font-medium">
                          {t("level")}
                        </th>
                        <th className="px-2 py-1 text-right font-medium">
                          {t("totalXp")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {levelRows
                        .slice(c * perCol, (c + 1) * perCol)
                        .map((r) => (
                          <tr key={r.level}>
                            <td className="px-2 py-0.5">{r.level}</td>
                            <td className="px-2 py-0.5 text-right font-mono tabular-nums">
                              {r.xp.toLocaleString(locale)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "xp.otherSkills")}
              </h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {payload.skills
                  .filter((s) => s.id !== skill)
                  .map((s) => (
                    <li key={s.id}>
                      <Link
                        href={localizePath(
                          `${XP_PLANNER_PATH}/${encodeURIComponent(s.id)}`,
                          locale,
                        )}
                        prefetch={false}
                        className="hover:text-amber-300"
                      >
                        {translate(dict, "xp.skillLink", {
                          vars: { skill: s.name },
                        })}
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          </div>
        }
      />
    </HeaderOffset>
  );
}
