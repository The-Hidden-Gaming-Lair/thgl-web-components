import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createBreeder,
  fetchVersion,
  getMetadataAlternates,
  localizePath,
  translate,
  DEFAULT_LOCALE,
  type BreedingGender,
  type BreedingPair,
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
  fetchBreedingData,
  getBreedingPals,
  type BreedingPalInfo,
} from "@/lib/breeding/data";

/**
 * Per-pal breeding page (/breeding/<palId>): every parent pair that hatches the
 * pal and what it breeds with each partner — server-rendered tables over the
 * same formula as the calculator, so each pal is its own indexable page.
 */
type PageProps = { params: Promise<{ locale?: string; id: string }> };

async function load(locale: string, id: string) {
  const appConfig = await getAppConfig();
  const data = await fetchBreedingData(appConfig.name);
  if (!data?.pals[id]) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const breeder = createBreeder(data);
  const pairs = breeder
    .parentsOf(id)
    .filter((p) => !(p.a === id && p.b === id));
  return { appConfig, data, dict, breeder, pairs };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, id } = await params;
  const { appConfig, dict, pairs } = await load(locale, id);
  const vars = {
    name: translate(dict, id),
    count: String(pairs.length),
  };
  const title = translate(dict, "breeding.palMetaTitle", { vars });
  const description = translate(dict, "breeding.palMetaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/breeding/${id}`,
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
  const { appConfig, data, dict, breeder, pairs } = await load(locale, id);
  const [version, pals] = await Promise.all([
    fetchVersion(appConfig.name),
    getBreedingPals(appConfig.name, data, dict),
  ]);
  const byId = new Map(pals.map((p) => [p.id, p]));
  const iconsHash = version.more.icons;
  const pal = byId.get(id)!;
  const t = (key: string, vars?: Record<string, string>) =>
    translate(dict, `breeding.${key}`, vars ? { vars } : undefined);

  const unique = pairs.filter((p) => p.outcome.via === "unique");
  const rank = pairs.filter((p) => p.outcome.via === "rank");
  // What this pal hatches with every partner (one row per partner).
  const withPartners = pals
    .filter((p) => p.id !== id)
    .flatMap((p) =>
      breeder.breed(id, p.id).map((o) => ({ partner: p.id, outcome: o })),
    );

  const breedingTitle = t("title");
  const heading = t("howToBreed", { name: pal.name });
  const crumbs = [
    { label: breedingTitle, href: "/breeding" },
    { label: pal.name },
  ];
  const pageUrl = `https://${appConfig.domain}.th.gl${localizePath(`/breeding/${id}`, locale)}`;
  // Icons only where they help scanning (first rows); the long tail stays
  // plain links so a 300-pair page doesn't ship a megabyte of sprite markup.
  const ICON_ROWS = 40;
  const chip = (pid: string, g?: BreedingGender | null, icon = true) => (
    <PalLink
      pal={byId.get(pid)}
      id={pid}
      icon={icon}
      gender={g ? t(g === "m" ? "gender.male" : "gender.female") : undefined}
      appName={appConfig.name}
      iconsHash={iconsHash}
      locale={locale}
    />
  );
  const pairRow = (p: BreedingPair, i: number) => (
    <li
      key={`${p.a}|${p.b}|${p.outcome.genders?.join("")}`}
      className="flex flex-wrap items-center gap-x-2 px-2 py-1"
    >
      {chip(p.a, p.outcome.genders?.[0], i < ICON_ROWS)}
      <span className="text-muted-foreground">+</span>
      {chip(p.b, p.outcome.genders?.[1], i < ICON_ROWS)}
    </li>
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
        id={appConfig.name}
        header={
          <div className="flex items-center gap-3">
            {pal.icon && (
              <SpriteIcon
                icon={pal.icon}
                appName={appConfig.name}
                iconsHash={iconsHash}
                size={64}
              />
            )}
            <div>
              <h2 className="text-2xl">{heading}</h2>
              <p className="text-sm">
                {unique.length && !rank.length
                  ? t("palIntroUnique", { name: pal.name })
                  : t("palIntro", {
                      name: pal.name,
                      rank: String(data.pals[id].rank),
                    })}
              </p>
            </div>
          </div>
        }
        content={
          <div className="text-left space-y-6">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>
                {t("rank")}: <b>{data.pals[id].rank}</b>
              </span>
              <span>
                {t("maleRate")}: <b>{data.pals[id].male}%</b>
              </span>
              <Link
                className="text-primary hover:underline"
                href={localizePath(
                  `/breeding?tab=parents&target=${id}`,
                  locale,
                )}
              >
                {t("openCalculator")}
              </Link>
              <Link
                className="text-primary hover:underline"
                href={localizePath(`/db/paldeck/${id}`, locale)}
              >
                {t("paldeck")} · {t("whereToCatch")}
              </Link>
            </div>

            {unique.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">{t("unique")}</h2>
                <ul className="divide-y rounded-md border">
                  {unique.map(pairRow)}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {t("allPairs")} ·{" "}
                {t("pairs.count", { count: String(pairs.length) })}
              </h2>
              {pairs.length === 0 ? (
                <p className="text-sm">{t("pairs.none")}</p>
              ) : (
                <ul className="divide-y rounded-md border">
                  {rank.map(pairRow)}
                </ul>
              )}
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">{pal.name} + … → …</h2>
              <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {withPartners.map(({ partner, outcome }) => (
                  <li
                    key={`${partner}|${outcome.child}`}
                    className="flex flex-wrap items-center gap-x-2 border-b py-1"
                  >
                    {chip(partner, outcome.genders?.[1], false)}
                    <span className="text-muted-foreground">→</span>
                    {chip(outcome.child, null, false)}
                  </li>
                ))}
              </ul>
            </section>

            {data.build && (
              <p className="text-xs text-muted-foreground">
                {t("build", { build: data.build })}
              </p>
            )}
          </div>
        }
      />
    </HeaderOffset>
  );
}

function PalLink({
  pal,
  id,
  icon = true,
  gender,
  appName,
  iconsHash,
  locale,
}: {
  pal?: BreedingPalInfo;
  id: string;
  icon?: boolean;
  gender?: string;
  appName: string;
  iconsHash?: string;
  locale: string;
}) {
  return (
    <Link
      href={localizePath(`/breeding/${id}`, locale)}
      className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-accent"
    >
      {!icon ? null : pal?.icon ? (
        <SpriteIcon
          icon={pal.icon}
          appName={appName}
          iconsHash={iconsHash}
          size={32}
        />
      ) : (
        <span className="inline-block h-8 w-8 shrink-0 rounded bg-muted" />
      )}
      <span>
        {pal?.name ?? id}
        {gender && (
          <span className="ml-1 text-xs text-muted-foreground">{gender}</span>
        )}
      </span>
    </Link>
  );
}
