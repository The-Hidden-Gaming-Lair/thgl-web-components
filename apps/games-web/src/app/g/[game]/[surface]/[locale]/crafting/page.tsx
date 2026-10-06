import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  craftingPageIds,
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
import { craftingLabels, loadCrafting } from "@/lib/crafting/data";
import { CraftingCalculator } from "@/lib/crafting/calculator";

/**
 * Crafting calculator hub — for tenants that list `/crafting` in
 * `internalLinks` and ship recipe data (database `ingredients` / `products`,
 * data-forge database-quality.md §5.1). The calculator itself loads its data
 * client-side; the page server-renders the intro and an A-Z list of every
 * per-item recipe page. Other games 404 here.
 */
type PageProps = { params: Promise<{ locale?: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = await params;
  const appConfig = await getAppConfig();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const vars = { title: appConfig.title };
  const title = translate(dict, "crafting.metaTitle", { vars });
  const description = translate(dict, "crafting.metaDescription", { vars });
  const { canonical, languageAlternates } = getMetadataAlternates(
    "/crafting",
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
  const data = await loadCrafting(appConfig);
  if (!data) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  const vars = { title: appConfig.title };
  const title = translate(dict, "crafting.title");
  const crumbs = [{ label: title }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/crafting`;
  const items = craftingPageIds(data)
    .map((id) => ({ id, name: resolveDict(dict, id) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));

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
      <PageTitle title={translate(dict, "crafting.metaTitle", { vars })} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <>
            <h2 className="text-2xl">
              {translate(dict, "crafting.heading", { vars })}
            </h2>
            <p className="text-sm">
              {translate(dict, "crafting.intro", {
                vars: { ...vars, count: items.length.toLocaleString(locale) },
              })}
            </p>
          </>
        }
        content={
          <div className="text-left space-y-8">
            <CraftingCalculator
              labels={craftingLabels(dict)}
              appName={appConfig.name}
              locale={locale}
              market={appConfig.craftingMarket}
            />
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {translate(dict, "crafting.allRecipes", {
                  vars: { count: items.length.toLocaleString(locale) },
                })}
              </h2>
              <ul className="columns-2 gap-4 text-sm sm:columns-3 lg:columns-4">
                {items.map((it) => (
                  <li key={it.id} className="break-inside-avoid">
                    <Link
                      href={localizePath(
                        `/crafting/${encodeURIComponent(it.id)}`,
                        locale,
                      )}
                      prefetch={false}
                      className="block truncate py-0.5 hover:text-amber-300"
                    >
                      {it.name}
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
