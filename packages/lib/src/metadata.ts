import { DEFAULT_LOCALE, localizePath } from "./i18n";

export function getMetadataAlternates(
  basePath: string,
  locale: string,
  supportedLocales: string[],
) {
  const languageAlternates = Object.fromEntries([
    ...supportedLocales.map((locale) => [
      locale,
      locale === DEFAULT_LOCALE ? basePath : localizePath(basePath, locale),
    ]),
    ["x-default", basePath],
  ]);

  const canonical =
    locale === DEFAULT_LOCALE ? basePath : localizePath(basePath, locale);
  return {
    canonical,
    languageAlternates,
  };
}
