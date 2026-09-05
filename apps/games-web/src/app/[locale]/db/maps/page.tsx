import { type Metadata } from "next";
import Link from "next/link";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchDict,
  getAppUrl,
  localizePath,
  DEFAULT_LOCALE,
} from "@repo/lib";
import { generateCategoryMetadata } from "@/games/homm-olden-era/metadata";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import { SectionJsonLd } from "@/lib/db/section-jsonld";
import GenericSectionPage, {
  generateMetadata as genericSectionMetadata,
} from "@/app/[locale]/db/[section]/page";

const APP_NAME = "homm-olden-era";

type PageProps = { params: Promise<{ locale?: string }> };

type MapProps = {
  gameMode?: string;
  winCondition?: string;
  sizeX?: number;
  sizeZ?: number;
  players?: number;
  preview?: string;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // Non-HoMM tenants delegate this shadowed slug to the generic [section] list.
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return genericSectionMetadata({
      params: Promise.resolve({ ...p, section: "maps" }),
    });
  }
  const { locale = DEFAULT_LOCALE } = await params;
  return generateCategoryMetadata(locale, "maps");
}

export default async function Page({ params }: PageProps) {
  const app = await getAppConfig();
  if (app.name !== "homm-olden-era") {
    const p = await params;
    return GenericSectionPage({
      params: Promise.resolve({ ...p, section: "maps" }),
    });
  }
  const appConfig = await requireApp("homm-olden-era");
  const { locale = DEFAULT_LOCALE } = await params;
  const [dict, mapsCat, indexDb] = await Promise.all([
    fetchDict(appConfig.name, locale),
    fetchDatabaseType(appConfig.name, "maps"),
    fetchDatabaseIndex(appConfig.name),
  ]);

  const sectionLabel = resolveDict(dict, "maps");

  // Group by game mode (SingleHero / Classic), modes in a stable order.
  const MODE_ORDER = ["SingleHero", "Classic"];
  const byMode = new Map<string, typeof mapsCat.items>();
  for (const item of mapsCat.items) {
    const mode = (item.props as MapProps).gameMode ?? "Other";
    if (!byMode.has(mode)) byMode.set(mode, []);
    byMode.get(mode)!.push(item);
  }
  const modes = [...byMode.keys()].sort((a, b) => {
    const ia = MODE_ORDER.indexOf(a);
    const ib = MODE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <>
      <SectionJsonLd
        appConfig={appConfig}
        section="maps"
        sectionLabel={sectionLabel}
        description={`Browse all PvP maps in ${appConfig.title}.`}
        dict={dict}
        database={indexDb}
        types={["maps"]}
        locale={locale}
      />
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Breadcrumb
          crumbs={[{ label: sectionLabel }]}
          locale={locale}
          dict={dict}
        />
        <h1 className="text-2xl font-bold mb-1">{sectionLabel}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {resolveDict(dict, "ui.map_rmg_note")}
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-10 space-y-8">
        {modes.map((mode) => {
          const items = [...byMode.get(mode)!].sort((a, b) =>
            resolveDict(dict, a.id).localeCompare(resolveDict(dict, b.id)),
          );
          const modeLabel = resolveDict(dict, `ui.map_mode_${mode}`);
          return (
            <section key={mode}>
              <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                {modeLabel} · {items.length}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item) => {
                  const p = item.props as MapProps;
                  const name = resolveDict(dict, item.id);
                  const winLabel = p.winCondition
                    ? resolveDict(dict, p.winCondition)
                    : "";
                  const previewUrl = p.preview
                    ? getAppUrl(APP_NAME, `/maps/${p.preview}`)
                    : null;
                  return (
                    <Link
                      key={item.id}
                      prefetch={false}
                      href={localizePath(`/db/maps/${item.id}`, locale)}
                      className="group block rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden hover:border-sky-700/70 transition-colors"
                    >
                      {previewUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
                          alt={`${name} schematic`}
                          width={300}
                          height={300}
                          loading="lazy"
                          className="w-full aspect-square object-cover bg-slate-950"
                        />
                      )}
                      <div className="px-3 py-2">
                        <div className="font-medium text-slate-200 group-hover:text-sky-300 transition-colors truncate">
                          {name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          {winLabel && <span>{winLabel}</span>}
                          {p.players != null && p.players > 0 && (
                            <span>· {p.players}P</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
