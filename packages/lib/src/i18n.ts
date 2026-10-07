import { cloneElement } from "react";

export type Dict = Record<string, string>;

/**
 * Default locale used throughout the app
 */
export const DEFAULT_LOCALE = "en";

/**
 * Replaces all {{variable}} placeholders in the given string with corresponding values.
 *
 * @param template - The string containing placeholders.
 * @param vars - An object containing keys and values to replace in the template.
 * @returns The interpolated string.
 */
export function interpolate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/{{(.*?)}}/g, (_, key) => vars[key.trim()] ?? "");
}

interface TranslateOptions {
  /** Whether to use the "_desc" variant of the term key */
  isDesc?: boolean;
  /** Fallback term key to use if the main key is not found */
  fallback?: string;
  /** Variables for interpolation (e.g., {{title}}) */
  vars?: Record<string, string>;
}

/**
 * Translates a term from a dictionary, with support for:
 * - fallback keys
 * - description variants (term_desc)
 * - string interpolation with variables
 * - pointer resolution (@1, @2, etc.)
 *
 * @param dict - The dictionary object with term translations.
 * @param term - The key to translate.
 * @param options - Optional translation behavior.
 * @returns The translated (and possibly interpolated) string.
 */
export function translate(
  dict: Dict,
  term: string,
  options?: TranslateOptions,
): string {
  if (!term) return "";

  const key = options?.isDesc ? `${term}_desc` : term;
  let value = dict[key];

  if (!value) {
    if (options?.fallback) {
      return translate(dict, options.fallback, {
        isDesc: options.isDesc,
        vars: options.vars,
      });
    }
    if (options?.isDesc) {
      value = "";
    } else {
      // Strip my_<timestamp>_ prefix from custom filter names
      value = term.replace(/^my_\d+_/, "");
    }
  }

  // Resolve pointer if value starts with @
  if (value && value[0] === "@") {
    value = dict[value] ?? value;
  }

  return options?.vars ? interpolate(value ?? "", options.vars) : (value ?? "");
}

export function getT(dict: Record<string, string>) {
  const t = Object.assign(
    (
      key: string = "",
      options?: {
        isDesc?: boolean;
        fallback?: string;
        vars?: Record<string, string>;
      },
    ) => translate(dict, key, options),

    {
      rich: (
        term: string,
        options: {
          fallback?: string;
          isDesc?: boolean;
          components?: Record<string, any>;
        },
      ): Array<string | any> => {
        const key = options?.isDesc ? `${term}_desc` : term;
        let template = dict[key];

        if (!template) {
          if (options?.fallback) {
            return t.rich(options.fallback, options);
          }
          if (options?.isDesc) {
            template = "";
          } else {
            // Strip my_<timestamp>_ prefix from custom filter names
            template = term.replace(/^my_\d+_/, "");
          }
        }

        // Resolve pointer if template starts with @
        if (template && template[0] === "@") {
          template = dict[template] ?? template;
        }

        return template.split(/({{.*?}})/g).map((part, index) => {
          const match = part.match(/{{(.*?)}}/);
          if (match) {
            const varName = match[1].trim();
            const Comp = options?.components?.[varName];
            return Comp ? cloneElement(Comp, { key: `comp-${index}` }) : null;
          }
          return part;
        });
      },
    },
  );

  return t;
}

/**
 * Label of an internalLinks map entry. A plain English config title of the
 * standard "<Name> Map" form that the dict doesn't translate falls back to the
 * localized `nav.mapTitle` template ("{{map}} Map" → "<Name> Karte"), so map
 * links read naturally on every locale without per-tenant keys (inbox #755).
 * For a `/maps/<English name>` link the name is the localized map name the
 * /maps cards show, read from the `mapName:` entries (see mapNameEntries), so
 * nav and cards agree (inbox #766).
 */
export function mapLinkTitle(
  t: (
    key: string,
    options?: { fallback?: string; vars?: Record<string, string> },
  ) => string,
  link: { title: string; href: string },
): string {
  const { title, href } = link;
  const translated = t(title);
  if (translated !== title || !title.endsWith(" Map")) return translated;
  const mapName = mapNameFromHref(href);
  const nameKey = mapName && `${MAP_NAME_KEY_PREFIX}${mapName}`;
  const localizedMap = nameKey ? t(nameKey) : undefined;
  return t("nav.mapTitle", {
    fallback: "{{map}} Map",
    vars: {
      map:
        localizedMap && localizedMap !== nameKey
          ? localizedMap
          : title.slice(0, -" Map".length),
    },
  });
}

const MAP_NAME_KEY_PREFIX = "mapName:";

/**
 * Dict entries mapping a map's English name (the `/maps/<name>` URL segment,
 * see the maps page) to its localized name — `mapName:<English>` → name — for
 * mapLinkTitle. Tile keys are game ids, so links can't look them up directly.
 * Only maps whose name differs from English get an entry.
 */
export function mapNameEntries(
  tileKeys: string[],
  dict: Dict,
  enDict: Dict,
): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const key of tileKeys) {
    const enName = translate(enDict, key);
    const name = translate(dict, key);
    if (enName && name && name !== enName)
      entries[`${MAP_NAME_KEY_PREFIX}${enName}`] = name;
  }
  return entries;
}

/** The map name of a `/maps/<name>` link (decoded), else undefined. */
export function mapNameFromHref(href: string): string | undefined {
  const match = /^\/maps\/([^/?#]+)/.exec(href);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function localizePath(
  href: string,
  locale: string,
  defaultLocale = "en",
): string {
  // Normalize href to always start with a slash and not end with one
  const normalizedHref = href.startsWith("/") ? href : `/${href}`;

  // Skip if locale is default or already localized
  if (
    locale === defaultLocale ||
    normalizedHref.startsWith(`/${locale}/`) ||
    normalizedHref === `/${locale}`
  ) {
    return normalizedHref.replace(/\/+$/, "") || "/"; // remove trailing slash if any
  }

  // Construct the localized path without trailing slash
  const localizedPath = `/${locale}${normalizedHref}`;
  return localizedPath.replace(/\/+$/, ""); // remove trailing slash if any
}
