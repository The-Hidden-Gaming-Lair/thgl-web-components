import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchVersion,
  getMetadataAlternates,
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
import { SpriteIcon } from "@/lib/db/sprite-icon";
import {
  fetchPrismanaData,
  getPrismanaView,
  prismanaLabel,
  type PrismanaRef,
} from "@/lib/prismana/data";
import { PrismanaTracker } from "@/lib/prismana/tracker";

/**
 * Prismana tracker — for tenants that ship `config/prismana.json` (Aniimo).
 * This week's hidden-area Prismana per server region, the rotation schedule,
 * every Prismana with the sources the game files list, how the Prismana
 * Flow works and the Prismana Orb / Mysterious Prismana Egg. Other games 404.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const title = translate(dict, "prismana.metaTitle");
  const description = translate(dict, "prismana.metaDescription");
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/prismana",
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

const LINK = "text-amber-300 underline underline-offset-2 hover:text-amber-200";

export default async function Page({ params }: PageProps) {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const data = await fetchPrismanaData(appConfig.name);
  if (!data) notFound();
  const [dict, version] = await Promise.all([
    getFullDbDictionary(appConfig.name, locale),
    fetchVersion(appConfig.name),
  ]);
  const view = await getPrismanaView(appConfig.name, data, dict, locale);
  const label = prismanaLabel(dict);
  // Only the strings the client island needs.
  const clientDict = Object.fromEntries(
    Object.entries(dict).filter(
      ([k]) => k.startsWith("prismana.") || k.startsWith("activities."),
    ),
  );
  const title = label("title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/prismana`;
  const sectionTitle =
    "text-xs font-semibold uppercase tracking-wider text-muted-foreground";
  const Item = ({ item }: { item: PrismanaRef }) => (
    <span className="inline-flex items-center gap-2">
      {item.icon && (
        <SpriteIcon
          icon={item.icon}
          appName={appConfig.name}
          iconsHash={version.more.icons}
          size={32}
        />
      )}
      {item.href ? (
        <Link href={item.href} prefetch={false} className={LINK}>
          {item.name}
        </Link>
      ) : (
        <span>{item.name}</span>
      )}
    </span>
  );

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
      <PageTitle title={label("metaTitle")} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">{label("heading")}</h2>
            <p className="text-sm">
              {label("intro", { count: String(view.entries.length) })}
            </p>
          </>
        }
        content={
          <div className="space-y-8 text-left">
            <PrismanaTracker
              view={view}
              dict={clientDict}
              appName={appConfig.name}
              iconsHash={version.more.icons}
              locale={locale}
            />
            <section className="space-y-3">
              <h2 className={sectionTitle}>{label("flowTitle")}</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {view.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <table className="text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pr-6 font-normal">{label("flowStage")}</th>
                    <th className="pr-6 font-normal">{label("flowEnergy")}</th>
                    <th className="font-normal">{label("flowChance")}</th>
                  </tr>
                </thead>
                <tbody>
                  {view.stages.map((s) => (
                    <tr key={s.stage}>
                      <td className="pr-6">{s.stage}</td>
                      <td className="pr-6 tabular-nums">
                        {s.energy.toLocaleString(locale)}
                      </td>
                      <td>{s.chance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="space-y-3">
              <h2 className={sectionTitle}>{label("moreTitle")}</h2>
              <div className="space-y-1 text-sm">
                <Item item={view.mystery} />
                <p>{view.mystery.desc}</p>
                <p className="text-muted-foreground">
                  {view.mystery.sources.join(" · ")}
                </p>
              </div>
              <div className="space-y-1 text-sm">
                <Item item={view.orb} />
                <p>{view.orb.use}</p>
                <p className="text-muted-foreground">
                  {view.orb.sources.join(" · ")}
                </p>
              </div>
            </section>
          </div>
        }
      />
    </HeaderOffset>
  );
}
