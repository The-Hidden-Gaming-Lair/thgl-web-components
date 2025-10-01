import type { Metadata } from "next";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { NavGrid, ReleaseNotes, Subtitle } from "@repo/ui/content";
import {
  AppConfig,
  DEFAULT_LOCALE,
  getMetadataAlternates,
  getT,
  getUpdateMessages,
  localizePath,
} from "@repo/lib";
import { getFullDictionary, getStaticDictionary } from "../../dicts";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createHomePageGenerateMetadata(appConfig: AppConfig) {
  return async function generateMetadata({
    params,
  }: PageProps): Promise<Metadata> {
    const { locale = DEFAULT_LOCALE } = await params;
    const dict = await getStaticDictionary(appConfig.name, locale);
    const t = getT(dict);

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords = appConfig.keywords.map((k) => t(k)).join(", ") ?? "";

    const title = t("home.pageTitle", { vars: { title: appConfig.title } });
    const description = t("home.intro", {
      vars: { title: appConfig.title, features, keywords },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/",
      locale,
      appConfig.supportedLocales,
    );

    return {
      title,
      description,
      keywords: appConfig.keywords.map((k) => t(k)),
      alternates: {
        canonical: canonical,
        languages: languageAlternates,
      },
      openGraph: {
        title,
        description,
        url: canonical,
      },
    };
  };
}

export function createHomePage(appConfig: AppConfig) {
  return async function Home({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, updateMessages] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      getUpdateMessages(appConfig.name),
    ]);
    const t = getT(dict);

    const features =
      appConfig.internalLinks
        ?.slice(0, 3)
        .map((link) => t(link.title))
        .join(", ") ?? "";

    const keywords = appConfig.keywords?.map((k) => t(k)).join(", ") ?? "";

    return (
      <HeaderOffset full>
        <PageTitle
          title={t("home.pageTitle", { vars: { title: appConfig.title } })}
        />
        <ContentLayout
          id={appConfig.name}
          header={
            <section className="space-y-4">
              <Subtitle
                title={t("home.sectionTitle", {
                  vars: { title: appConfig.title },
                })}
              />
              <p className="text-muted-foreground">
                {t("home.intro", {
                  vars: { title: appConfig.title, features, keywords },
                })}
              </p>
              {appConfig.internalLinks && (
                <NavGrid cards={appConfig.internalLinks} />
              )}
            </section>
          }
          content={<ReleaseNotes updateMessages={updateMessages} />}
        />
      </HeaderOffset>
    );
  };
}
