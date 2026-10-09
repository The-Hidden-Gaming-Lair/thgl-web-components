import Link from "next/link";
import { localizePath } from "@repo/lib";
import { resolveDict } from "@/lib/db/resolve-dict";
import { SpriteIcon } from "@/lib/db/sprite-icon";
import { EntityTooltip } from "@/lib/db/entity-tooltip";
import { TYPE_SECTION } from "@/games/homm-olden-era/sections";

type IconSprite = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DatabaseItem = {
  id: string;
  icon?: IconSprite | string;
  props?: Record<string, unknown>;
  groupId?: string;
};

type DatabaseEntry = {
  type: string;
  items: DatabaseItem[];
};

const APP_NAME = "homm-olden-era";

export function findItem(
  database: DatabaseEntry[],
  itemId: string,
): { item: DatabaseItem; type: string } | undefined {
  for (const entry of database) {
    const item = entry.items.find((i) => i.id === itemId);
    if (item) return { item, type: entry.type };
  }
  return undefined;
}

export function getHref(type: string, itemId: string, locale = "en"): string {
  const section = TYPE_SECTION[type] ?? type;
  return localizePath(`/db/${section}/${itemId}`, locale);
}

export function EntityLink({
  itemId,
  database,
  dict,
  showIcon = true,
  className = "",
  locale = "en",
  iconsHash,
}: {
  itemId: string;
  database: DatabaseEntry[];
  dict: Record<string, string>;
  showIcon?: boolean;
  className?: string;
  locale?: string;
  iconsHash?: string;
}) {
  const found = findItem(database, itemId);
  if (!found) {
    return (
      <span className={`text-sm ${className}`}>
        {resolveDict(dict, itemId)}
      </span>
    );
  }

  const { item, type } = found;
  const name = resolveDict(dict, item.id);
  const icon =
    item.icon && typeof item.icon === "object"
      ? (item.icon as IconSprite)
      : undefined;

  return (
    <EntityTooltip entityId={item.id} locale={locale}>
      <Link
        href={getHref(type, item.id, locale)}
        prefetch={false}
        className={`inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors ${className}`}
      >
        {showIcon && icon && (
          <SpriteIcon
            icon={icon}
            appName={APP_NAME}
            size={20}
            iconsHash={iconsHash}
          />
        )}
        <span>{name}</span>
      </Link>
    </EntityTooltip>
  );
}

export function EntityLinkCard({
  itemId,
  database,
  dict,
  subtitle,
  locale = "en",
  iconsHash,
}: {
  itemId: string;
  database: DatabaseEntry[];
  dict: Record<string, string>;
  subtitle?: string;
  locale?: string;
  iconsHash?: string;
}) {
  const found = findItem(database, itemId);
  if (!found) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2 text-sm">
        {resolveDict(dict, itemId)}
      </div>
    );
  }

  const { item, type } = found;
  const name = resolveDict(dict, item.id);
  const icon =
    item.icon && typeof item.icon === "object"
      ? (item.icon as IconSprite)
      : undefined;

  return (
    <EntityTooltip entityId={item.id} locale={locale}>
      <Link
        href={getHref(type, item.id, locale)}
        prefetch={false}
        className="flex items-center gap-2 bg-slate-900/30 border border-slate-800/50 rounded px-3 py-2 hover:border-amber-800/50 hover:bg-slate-900/50 transition-colors group"
      >
        {icon && (
          <SpriteIcon
            icon={icon}
            appName={APP_NAME}
            size={32}
            iconsHash={iconsHash}
          />
        )}
        <div>
          <span className="text-sm font-medium group-hover:text-amber-400 transition-colors">
            {name}
          </span>
          {subtitle && (
            <span className="block text-xs text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
      </Link>
    </EntityTooltip>
  );
}

export function RelatedSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
