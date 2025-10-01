import type { Metadata } from "next";
import Link from "next/link";
import {
  AppConfig,
  DEFAULT_LOCALE,
  fetchVersion,
  getIconsUrl,
  getMetadataAlternates,
  getT,
  IconSprite,
  localizePath,
} from "@repo/lib";
import { HeaderOffset, PageTitle } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { Subtitle } from "@repo/ui/content";
import { getFullDictionary, getStaticDictionary } from "../../dicts";
import { JSONLDScript } from "./json-ld-script";

type PageProps = {
  params: Promise<{ locale?: string }>;
};

export function createGuidesPageGenerateMetadata(appConfig: AppConfig) {
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

    const title = t("guides.pageTitle", { vars: { title: appConfig.title } });
    const description = t("guides.intro", {
      vars: { title: appConfig.title, features },
    });

    const { canonical, languageAlternates } = getMetadataAlternates(
      "/guides",
      locale,
      appConfig.supportedLocales,
    );

    const metaData: Metadata = {
      title: title,
      description: description,
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
    return metaData;
  };
}

export function createGuidesPage(appConfig: AppConfig) {
  return async function GuidesPage({ params }: PageProps) {
    const { locale = DEFAULT_LOCALE } = await params;
    const [dict, version] = await Promise.all([
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);
    const t = getT(dict);

    const guideTypes = version.data.filters.flatMap((filter) =>
      filter.values.map((v) => ({
        type: v.id,
        label: t(v.id),
        description: t("guides.typeDescription", {
          vars: { type: t(v.id), title: appConfig.title },
        }),
        icon: v.icon as IconSprite,
      })),
    );

    const guideGroups = version.data.filters.map((filter) => ({
      type: filter.group,
      label: t(filter.group),
      description: t("guides.typeDescription", {
        vars: {
          type: t(filter.group),
          title: appConfig.title,
        },
      }),
      icon: null,
    }));

    const allGuides = [...guideGroups, ...guideTypes];

    return (
      <>
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: allGuides.map((g, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: g.label,
              url: `https://${appConfig.domain}.th.gl${localizePath(`/guides/${version.data.enDict[g.type]}`, locale)}`,
            })),
          }}
        />
        <JSONLDScript
          json={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `https://${appConfig.domain}.th.gl${localizePath("/", locale)}`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Guides",
                item: `https://${appConfig.domain}.th.gl${localizePath("/guides", locale)}`,
              },
            ],
          }}
        />

        <HeaderOffset full>
          <PageTitle
            title={t("guides.pageTitle", { vars: { title: appConfig.title } })}
          />
          <ContentLayout
            id={appConfig.name}
            header={
              <>
                <Subtitle title={t("guides.title")} />
                <p className="text-sm mt-2">
                  {t.rich("guides.description", {
                    components: { title: <strong>{appConfig.title}</strong> },
                  })}
                </p>
              </>
            }
            content={
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {allGuides.map((guide) => (
                  <li
                    key={guide.type}
                    className="border rounded-lg p-4 hover:shadow transition"
                  >
                    <Link
                      href={localizePath(
                        `/guides/${encodeURIComponent(version.data.enDict[guide.type])}`,
                        locale,
                      )}
                      className="block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {guide.icon && (
                          <img
                            alt=""
                            role="presentation"
                            className="shrink-0 object-none w-[64px] h-[64px]"
                            src={getIconsUrl(
                              appConfig.name,
                              guide.icon.url,
                              version.more.icons,
                            )}
                            width={guide.icon.width}
                            height={guide.icon.height}
                            style={{
                              objectPosition: `-${guide.icon.x}px -${guide.icon.y}px`,
                              zoom: 0.35,
                            }}
                          />
                        )}
                        <h2 className="text-lg font-semibold">{guide.label}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground text-left">
                        {guide.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            }
          />
        </HeaderOffset>
      </>
    );
  };
}
