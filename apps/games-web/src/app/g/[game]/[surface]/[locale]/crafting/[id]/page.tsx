import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchVersion,
  formatRecipeChoice,
  getMetadataAlternates,
  localizePath,
  planCrafting,
  recipeYield,
  translate,
  DEFAULT_LOCALE,
  type CraftRecipe,
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
  craftItemInfos,
  craftingLabels,
  loadCrafting,
  type CraftItemInfo,
} from "@/lib/crafting/data";
import {
  CraftTree,
  ItemLabel,
  MapLink,
  SellerChips,
  SlotHint,
  StationChips,
  craftT,
  formatQty,
} from "@/lib/crafting/tree";

/**
 * Per-item recipe page (/crafting/<id>): every recipe that makes the item,
 * the raw materials for one craft, the full ingredient tree and what the item
 * is used for — server-rendered, one indexable page per craftable codex entry
 * ("<item> recipe & materials"). Ids without a default recipe 404.
 */
type PageProps = { params: Promise<{ locale?: string; id: string }> };

const USED_IN_MAX = 60;

async function load(locale: string, rawId: string) {
  let id = rawId;
  try {
    id = decodeURIComponent(rawId);
  } catch {
    /* already decoded / malformed: use as is */
  }
  const appConfig = await getAppConfig();
  const data = await loadCrafting(appConfig);
  const def = data?.graph.defaults[id];
  if (!data || def == null) notFound();
  const inIndex = data.index.some(
    (c) => !c.type.startsWith("_") && c.items.some((i) => i.id === id),
  );
  if (!inIndex) notFound();
  const dict = await getFullDbDictionary(appConfig.name, locale);
  return { id, appConfig, data, dict, def };
}

function ingredientText(
  recipe: CraftRecipe,
  dict: Record<string, string>,
  locale: string,
  crafts = 1,
) {
  return recipe.ingredients
    .map(
      (g) =>
        `${(g.count * crafts).toLocaleString(locale)}× ${g.any ? g.any.group : resolveDict(dict, g.id)}`,
    )
    .join(", ");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE, id: rawId } = await params;
  const { id, appConfig, data, dict, def } = await load(locale, rawId);
  const recipe = data.graph.recipes[def];
  const vars = {
    name: resolveDict(dict, id),
    title: appConfig.title,
    ingredients: ingredientText(recipe, dict, locale),
  };
  const title = translate(dict, "crafting.itemMetaTitle", { vars });
  const description = translate(dict, "crafting.itemMetaDescription", {
    vars,
  });
  const { canonical, languageAlternates } = getMetadataAlternates(
    `/crafting/${encodeURIComponent(id)}`,
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
  const { id, appConfig, data, dict, def } = await load(locale, rawId);
  const version = await fetchVersion(appConfig.name);
  const { graph } = data;
  const recipe = graph.recipes[def];
  const yieldN = recipeYield(recipe, id);
  const plan = planCrafting(graph, [{ id, qty: yieldN }]);
  const usedIn = [
    ...new Set(
      (graph.usedIn[id] ?? []).flatMap((i) =>
        graph.recipes[i].products
          .map((p) => p.id)
          .filter((p) => p !== id && graph.defaults[p] != null),
      ),
    ),
  ];
  const alternatives = (graph.byProduct[id] ?? []).filter((i) => i !== def);

  // Display info only for what this page shows (not the whole graph).
  const shown = new Set<string>([id]);
  const addRecipe = (r: CraftRecipe) => {
    r.ingredients.forEach((g) => shown.add(g.id));
    r.stations.forEach((s) => s.id && shown.add(s.id));
  };
  addRecipe(recipe);
  alternatives.forEach((i) => addRecipe(graph.recipes[i]));
  plan.raw.forEach((l) => shown.add(l.id));
  plan.crafted.forEach((c) => {
    shown.add(c.id);
    addRecipe(graph.recipes[c.recipe]);
  });
  usedIn.slice(0, USED_IN_MAX).forEach((u) => shown.add(u));
  const infos = craftItemInfos(appConfig, data, dict, version, shown);

  // Ingredients that have their own recipe page link there, the rest to the codex.
  const crafted = new Set(
    [...shown].filter((s) => graph.defaults[s] != null && infos[s]?.db),
  );
  const labels = craftingLabels(dict);
  const t = craftT(labels);
  const name = infos[id]?.name ?? id;
  const iconsHash = version.more.icons;
  const common = { appName: appConfig.name, iconsHash, locale };
  const crumbs = [{ label: t("title"), href: "/crafting" }, { label: name }];
  const pageUrl = `https://${appConfig.domain}.th.gl${localizePath(`/crafting/${encodeURIComponent(id)}`, locale)}`;
  const heading = t("itemHeading", { name });
  const calcHref = (choiceKey?: string) => {
    const r = choiceKey ? formatRecipeChoice({ [id]: choiceKey }, graph) : "";
    return `${localizePath("/crafting", locale)}?items=${encodeURIComponent(id)}:${yieldN}${r ? `&r=${r}` : ""}`;
  };

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
            {infos[id]?.icon && (
              <SpriteIcon
                icon={infos[id].icon!}
                appName={appConfig.name}
                iconsHash={iconsHash}
                size={64}
              />
            )}
            <div>
              <h2 className="text-2xl">{heading}</h2>
              <p className="text-sm">
                {t(yieldN > 1 ? "itemIntroYield" : "itemIntro", {
                  name,
                  yield: yieldN,
                  ingredients: ingredientText(recipe, dict, locale),
                })}
              </p>
            </div>
          </div>
        }
        content={
          <div className="text-left space-y-8">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link
                href={calcHref()}
                prefetch={false}
                className="text-primary hover:underline"
              >
                {t("openCalculator")}
              </Link>
              {infos[id]?.db && (
                <Link
                  href={localizePath(infos[id].db!, locale)}
                  prefetch={false}
                  className="text-primary hover:underline"
                >
                  {t("viewInCodex")}
                </Link>
              )}
              <MapLink
                info={infos[id]}
                locale={locale}
                label={t("showOnMap")}
              />
            </div>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">{t("recipe")}</h2>
              <RecipeCard
                recipe={recipe}
                productId={id}
                infos={infos}
                common={common}
                t={t}
                crafted={crafted}
              />
            </section>

            {alternatives.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">
                  {t("otherRecipes", { count: alternatives.length })}
                </h2>
                <div className="space-y-2">
                  {alternatives.map((i) => (
                    <RecipeCard
                      key={graph.recipes[i].key}
                      recipe={graph.recipes[i]}
                      productId={id}
                      infos={infos}
                      common={common}
                      t={t}
                      crafted={crafted}
                      calcHref={calcHref(graph.recipes[i].key)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h2 className="text-lg font-semibold">
                {t("rawForOne", { qty: yieldN, name })}
              </h2>
              <ul className="divide-y rounded-md border">
                {plan.raw.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 text-sm"
                  >
                    <span className="w-16 shrink-0 text-right font-mono tabular-nums text-amber-200">
                      {formatQty(l.qty, locale)}×
                    </span>
                    <span className="min-w-0 flex-1">
                      <ItemLabel id={l.id} info={infos[l.id]} {...common} />
                    </span>
                    <MapLink
                      info={infos[l.id]}
                      locale={locale}
                      label={t("showOnMap")}
                    />
                    {infos[l.id]?.sellers && (
                      <span className="w-full pl-[4.75rem]">
                        <SellerChips
                          info={infos[l.id]}
                          locale={locale}
                          label={t("soldBy")}
                        />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {plan.stations.length > 0 && (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("stations")}:
                  </span>
                  <StationChips
                    stations={plan.stations.map((s) => s.station)}
                    infos={infos}
                    locale={locale}
                  />
                </p>
              )}
              {plan.surplus.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("surplus")}{" "}
                  {plan.surplus
                    .map(
                      (l) =>
                        `${formatQty(l.qty, locale)}× ${infos[l.id]?.name ?? resolveDict(dict, l.id)}`,
                    )
                    .join(", ")}
                </p>
              )}
            </section>

            {plan.crafted.length > 1 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">{t("tree")}</h2>
                <CraftTree
                  id={id}
                  qty={yieldN}
                  graph={graph}
                  choice={{}}
                  infos={infos}
                  labels={labels}
                  {...common}
                  openDepth={2}
                  maxNodes={300}
                />
              </section>
            )}

            {usedIn.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">
                  {t("usedIn", { name, count: usedIn.length })}
                </h2>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                  {usedIn.slice(0, USED_IN_MAX).map((u) => (
                    <li key={u}>
                      <ItemLabel
                        id={u}
                        info={infos[u]}
                        {...common}
                        href={`/crafting/${encodeURIComponent(u)}`}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        }
      />
    </HeaderOffset>
  );
}

function RecipeCard({
  recipe,
  productId,
  infos,
  common,
  t,
  calcHref,
  crafted,
}: {
  crafted: Set<string>;
  recipe: CraftRecipe;
  productId: string;
  infos: Record<string, CraftItemInfo>;
  common: { appName: string; iconsHash?: string; locale: string };
  t: ReturnType<typeof craftT>;
  calcHref?: string;
}) {
  const y = recipeYield(recipe, productId);
  const byproducts = recipe.products.filter((p) => p.id !== productId);
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {y > 1 ? t("makesPerCraft", { yield: y }) : t("makesOne")}
        </span>
        <StationChips
          stations={recipe.stations}
          infos={infos}
          locale={common.locale}
        />
        {calcHref && (
          <Link
            href={calcHref}
            prefetch={false}
            className="ml-auto text-xs text-primary hover:underline"
          >
            {t("useThisRecipe")}
          </Link>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {recipe.ingredients.map((g) => (
          <li
            key={`${g.any?.group ?? ""}|${g.id}`}
            className="flex flex-wrap items-center gap-2 text-sm"
          >
            <span className="w-12 shrink-0 text-right font-mono tabular-nums text-amber-200">
              {formatQty(g.count, common.locale)}×
            </span>
            <ItemLabel
              id={g.id}
              info={infos[g.id]}
              {...common}
              href={
                crafted.has(g.id)
                  ? `/crafting/${encodeURIComponent(g.id)}`
                  : undefined
              }
            />
            {g.any && g.any.options.length > 1 && (
              <span className="text-xs text-muted-foreground">
                <SlotHint group={g.any.group} />{" "}
                {t("anyOfCount", { count: g.any.options.length })}
              </span>
            )}
          </li>
        ))}
      </ul>
      {byproducts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("byproducts")}{" "}
          {byproducts
            .map((p) => `${p.count}× ${infos[p.id]?.name ?? p.id}`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}
