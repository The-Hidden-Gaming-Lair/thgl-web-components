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
      value = term;
    }
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
            template = term;
          }
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
    return normalizedHref.replace(/\/+$/, ""); // remove trailing slash if any
  }

  // Construct the localized path without trailing slash
  const localizedPath = `/${locale}${normalizedHref}`;
  return localizedPath.replace(/\/+$/, ""); // remove trailing slash if any
}
