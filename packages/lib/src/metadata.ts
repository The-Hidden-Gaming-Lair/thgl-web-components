import { DEFAULT_LOCALE, localizePath } from "./i18n";

/**
 * Canonical + hreflang alternates. `basePath` is either one path shared by
 * every locale, or a per-locale path (translated slugs such as
 * `/guides/<localized name>`) so each alternate points at the URL the sitemap
 * lists for that locale, not at the requested slug under another prefix.
 */
export function getMetadataAlternates(
  basePath: string | ((locale: string) => string),
  locale: string,
  supportedLocales: string[],
) {
  const pathFor = (l: string) => {
    const path = typeof basePath === "string" ? basePath : basePath(l);
    return l === DEFAULT_LOCALE ? path : localizePath(path, l);
  };
  const languageAlternates = Object.fromEntries([
    ...supportedLocales.map((l) => [l, pathFor(l)]),
    ["x-default", pathFor(DEFAULT_LOCALE)],
  ]);

  const canonical = pathFor(locale);
  return {
    canonical,
    languageAlternates,
  };
}
