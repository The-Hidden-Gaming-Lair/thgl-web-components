import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
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
import {
  blueprintLabels,
  fetchBlueprintData,
  localizeBlueprintData,
  getBlueprintOptions,
} from "@/lib/blueprints/data";
import { BlueprintIconBox, BlueprintPlanner } from "@/lib/blueprints/planner";

/**
 * Per-blueprint page (/blueprints/<id>): the Starchrom price of every star, the
 * total to max, fragments to fuse and the gear it crafts — server-rendered, one
 * indexable page per blueprint — with the calculator preset to that blueprint.
 */
type PageProps = { params: Promise<{ locale?: string; id: string }> };

async function load(locale: string, rawId: string) {
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    /* already decoded / malformed: use as is */
  }
  const appConfig = await getAppConfig();
  const data = await fetchBlueprintData(appConfig.name);
  const bp = data?.blueprints[id];
  if (!data || !bp) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  return { id, appConfig, data: localizeBlueprintData(data, dict), bp, dict };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, id: rawId } = await params;
  const { id, appConfig, data, bp, dict } = await load(locale, rawId);
  const vars = {
    name: resolveDict(dict, id),
    currency: data.currency.name,
    unlock: bp.costs[0]!.toLocaleString(locale),
    max: bp.costs.reduce((a, b) => a + b, 0).toLocaleString(locale),
    stars: String(bp.costs.length),
  };
  const title = translate(dict, "blueprints.itemMetaTitle", { vars });
  const description = translate(dict, "blueprints.itemMetaDescription", {
    vars,
  });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/blueprints/${encodeURIComponent(id)}`,
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
  const { locale = DEFAULT_LOCALE, id: rawId } = await params;
  const { id, appConfig, data, bp, dict } = await load(locale, rawId);
  const [version, options] = await Promise.all([
    fetchVersion(appConfig.name),
    getBlueprintOptions(appConfig.name, data, dict),
  ]);
  const option = options.find((o) => o.id === id);
  const name = resolveDict(dict, id);
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(dict, `blueprints.${key}`, {
      vars: vars
        ? Object.fromEntries(
            Object.entries(vars).map(([k, v]) => [k, String(v)]),
          )
        : undefined,
    });
  const fmt = (n: number) => n.toLocaleString(locale);
  const currency = data.currency.name;
  const toMax = bp.costs.reduce((a, b) => a + b, 0);
  let running = 0;

  const hubTitle = translate(dict, "blueprints.title");
  const crumbs = [{ label: hubTitle, href: "/blueprints" }, { label: name }];
  const url = `https://${appConfig.domain}.th.gl${locale === DEFAULT_LOCALE ? "" : `/${locale}`}/blueprints/${encodeURIComponent(id)}`;

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
      <PageTitle title={t("itemHeading", { name })} />
      <div className="px-4 pt-2">
        <Breadcrumb crumbs={crumbs} locale={locale} dict={dict} />
      </div>
      <ContentLayout
        id={appConfig.name}
        header={
          <div className="flex items-center gap-3">
            <BlueprintIconBox
              option={option}
              size={56}
              appName={appConfig.name}
              iconsHash={version.more.icons}
            />
            <div>
              <h2 className="text-2xl">{t("itemHeading", { name })}</h2>
              <p className="text-sm">
                {data.rarities[bp.rarity] ?? bp.rarity} · {t(`kind.${bp.kind}`)}{" "}
                · {t("maxStars", { n: bp.costs.length })}
              </p>
            </div>
          </div>
        }
        content={
          <div className="space-y-8 text-left">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold">
                {t("costTable", { currency })}
              </h3>
              <table className="w-full max-w-xl text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1 font-normal">{t("col.star")}</th>
                    <th className="py-1 text-right font-normal">
                      {t("col.cost")}
                    </th>
                    <th className="py-1 text-right font-normal">
                      {t("col.total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bp.costs.map((c, i) => {
                    running += c;
                    return (
                      <tr key={i} className="border-t">
                        <td className="py-1.5">
                          {i === 0 ? t("unlock") : `★${i + 1}`}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {fmt(c)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                          {fmt(running)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-sm">
                {t("summary", {
                  name,
                  currency,
                  unlock: fmt(bp.costs[0]!),
                  max: fmt(toMax),
                  stars: bp.costs.length,
                })}
                {bp.fragments > 0 &&
                  ` ${t("fragments", { n: fmt(bp.fragments) })}`}
              </p>
            </section>

            {bp.gear.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold">{t("crafts")}</h3>
                <ul className="flex flex-wrap gap-2 text-sm">
                  {bp.gear.map((g) => (
                    <li key={g.id}>
                      <Link
                        className="rounded border px-2 py-1 hover:bg-accent"
                        href={localizePath(`/crafting/${g.id}`, locale)}
                      >
                        {resolveDict(dict, g.id)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-lg font-semibold">{t("planTitle")}</h3>
              <BlueprintPlanner
                data={data}
                options={options}
                labels={blueprintLabels(dict)}
                appName={appConfig.name}
                iconsHash={version.more.icons}
                locale={locale}
                initial={[{ id, from: 0, to: bp.costs.length }]}
              />
            </section>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                className="text-primary hover:underline"
                href={localizePath(`/db/blueprints/${id}`, locale)}
              >
                {t("codexLink", { name })} →
              </Link>
              <Link
                className="text-primary hover:underline"
                href={localizePath("/blueprints", locale)}
              >
                {t("allBlueprints")} →
              </Link>
            </div>
          </div>
        }
      />
    </HeaderOffset>
  );
}
