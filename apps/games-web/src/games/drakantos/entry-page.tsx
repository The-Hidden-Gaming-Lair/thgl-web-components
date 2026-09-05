import { type Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchDatabaseIndex,
  fetchDatabaseType,
  fetchVersion,
  DEFAULT_LOCALE,
  getIconsUrl,
} from "@repo/lib";
import { getFullDictionary } from "@repo/ui/dicts";
import { generateEntryMetadata } from "./metadata";
import { GenericEntityView } from "@/lib/db/generic-view";
import { getAppConfig, requireApp } from "@/lib/get-app-config";
import { resolveDict } from "@/lib/db/resolve-dict";
import { Breadcrumb } from "@/lib/db/breadcrumb";
import GenericEntryPage, {
  generateMetadata as genericEntryMetadata,
} from "@/app/[locale]/db/[section]/[id]/page";

type Params = Promise<{ id: string; locale?: string }>;

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Factory: returns Next.js page + generateMetadata for a Drakantos DB entry.
 * Each `/db/<section>/[id]/page.tsx` is a 3-line wrapper around this.
 *
 * @param section URL slug for the parent listing (e.g. "items")
 * @param allowedTypes Database `type`s that this section accepts. The detail
 *                     page will 404 if the requested id doesn't live in one
 *                     of these. Defaults to `[section]`.
 */
export function makeEntryPage(
  section: string,
  allowedTypes: string[] = [section],
) {
  // Non-Drakantos tenants delegate to the generic [section]/[id] page — these
  // static slugs shadow it (see reference_db_reserved_route_slugs).
  async function generateMetadata({
    params,
  }: {
    params: Params;
  }): Promise<Metadata> {
    const app = await getAppConfig();
    if (app.name !== "drakantos") {
      const p = await params;
      return genericEntryMetadata({
        params: Promise.resolve({ ...p, section }),
      });
    }
    const { id, locale = DEFAULT_LOCALE } = await params;
    return generateEntryMetadata(locale, section, id);
  }

  async function EntryPage({ params }: { params: Params }) {
    const app = await getAppConfig();
    if (app.name !== "drakantos") {
      const p = await params;
      return GenericEntryPage({
        params: Promise.resolve({ ...p, section }),
      });
    }
    const appConfig = await requireApp("drakantos");
    const { id, locale = DEFAULT_LOCALE } = await params;

    const [index, dict, version] = await Promise.all([
      fetchDatabaseIndex(appConfig.name),
      getFullDictionary(appConfig.name, locale),
      fetchVersion(appConfig.name),
    ]);
    const iconsHash = version.more.icons;

    // Find which type this id belongs to
    const matchingType = index.find((cat) =>
      cat.items.some((i) => i.id === id),
    )?.type;
    if (!matchingType || !allowedTypes.includes(matchingType)) notFound();

    // Fetch the full type to get props
    const fullType = await fetchDatabaseType(appConfig.name, matchingType);
    const item = fullType.items.find((i) => i.id === id);
    if (!item) notFound();

    const name = resolveDict(dict, id);
    const desc = resolveDict(dict, `${id}_desc`);
    const sectionLabel = resolveDict(
      dict,
      `config.internalLinks.${section}.title`,
    );
    const groupId = (item as { groupId?: string }).groupId;
    const groupLabel = groupId ? resolveDict(dict, groupId) : undefined;
    const rawIcon =
      item.icon && typeof item.icon === "object"
        ? (item.icon as IconSprite)
        : undefined;
    const icon = rawIcon
      ? {
          url: getIconsUrl(appConfig.name, rawIcon.url, iconsHash),
          x: rawIcon.x,
          y: rawIcon.y,
          width: rawIcon.width,
          height: rawIcon.height,
        }
      : undefined;

    return (
      <>
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <Breadcrumb
            crumbs={[
              { label: sectionLabel, href: `/db/${section}` },
              { label: name },
            ]}
            locale={locale}
            dict={dict}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <GenericEntityView
            id={item.id}
            name={name}
            desc={desc}
            groupLabel={groupLabel}
            icon={icon}
            props={item.props as Record<string, unknown> | undefined}
            iconsHash={iconsHash}
            appName={appConfig.name}
          />
        </div>
      </>
    );
  }

  return { Page: EntryPage, generateMetadata };
}
