import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMetadataAlternates,
  localizePath,
  translate,
  trainableSkills,
  xpForLevel,
  XP_PLANNER_PATH,
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
  loadXpPlanner,
  skillName,
  xpDict,
  xpLabels,
} from "@/lib/xp-planner/data";
import { XpPlanner } from "@/lib/xp-planner/planner";

/**
 * Skill XP planner hub — for every game that ships `config/xp.json`
 * (data-forge; RuneScape: Dragonwilds first). The planner loads its data
 * client-side; the page server-renders the intro and links to one SEO page
 * per skill. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const vars = { title: appConfig.title };
  const title = translate(dict, "xp.metaTitle", { vars });
  const description = translate(dict, "xp.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    XP_PLANNER_PATH,
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
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const config = await loadXpPlanner(appConfig);
  if (!config) notFound();
  const dict = xpDict(
    config,
    await getFullDbDictionary(appConfig.name, locale),
    locale,
  );
  const vars = { title: appConfig.title };
  const title = translate(dict, "xp.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${localizePath(XP_PLANNER_PATH, locale)}`;
  const skills = trainableSkills(config);
  const max = config.curve.length;

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
      <PageTitle title={translate(dict, "xp.metaTitle", { vars })} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">
              {translate(dict, "xp.heading", { vars })}
            </h2>
            <p className="text-sm">
              {translate(dict, "xp.intro", {
                vars: {
                  ...vars,
                  skills: skills.length.toLocaleString(locale),
                  methods: config.methods.length.toLocaleString(locale),
                  max: String(max),
                  xp: xpForLevel(config.curve, max).toLocaleString(locale),
                },
              })}
            </p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <XpPlanner
              labels={xpLabels(dict)}
              appName={appConfig.name}
              locale={locale}
              basePath={XP_PLANNER_PATH}
            />
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "xp.skillGuides")}
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
                {skills.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={localizePath(
                        `${XP_PLANNER_PATH}/${encodeURIComponent(s.id)}`,
                        locale,
                      )}
                      prefetch={false}
                      className="block py-0.5 hover:text-amber-300"
                    >
                      {translate(dict, "xp.skillLink", {
                        vars: { skill: skillName(config, dict, s.id) },
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
