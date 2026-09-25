import { type Metadata } from "next";
import { getMetadataAlternates } from "@repo/lib";
import { getFullDbDictionary } from "@repo/ui/dicts";
import { resolveDict } from "@/lib/db/resolve-dict";
import { drakantos } from "@/configs/drakantos";

const APP_NAME = drakantos.name;
const SUPPORTED_LOCALES = drakantos.supportedLocales;
const KEYWORDS = drakantos.keywords ?? [];
const GAME_TITLE = "Drakantos";

const OG_IMAGE = {
  url: "https://drakantos.th.gl/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: GAME_TITLE,
};

export async function generateCategoryMetadata(
  locale: string,
  section: string,
  labelOverride?: string,
): Promise<Metadata> {
  const dict = await getFullDbDictionary(APP_NAME, locale);
  const sectionLabel =
    labelOverride ?? resolveDict(dict, `config.internalLinks.${section}.title`);
  const title = `${sectionLabel} | ${GAME_TITLE}`;
  const description = `Browse all ${sectionLabel.toLowerCase()} in ${GAME_TITLE}. Sprite-decrypted game data from a live capture.`;
  const path = `/db/${section}`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    SUPPORTED_LOCALES,
  );
  return {
    title,
    description,
    keywords: [...KEYWORDS, sectionLabel],
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical, images: [OG_IMAGE] },
  };
}

export async function generateEntryMetadata(
  locale: string,
  section: string,
  id: string,
): Promise<Metadata> {
  const dict = await getFullDbDictionary(APP_NAME, locale);
  const entryName = resolveDict(dict, id);
  const sectionLabel = resolveDict(
    dict,
    `config.internalLinks.${section}.title`,
  );
  const desc = resolveDict(dict, `${id}_desc`);
  const hasDesc = desc && desc !== `${id}_desc` && desc !== id;
  const title = `${entryName} | ${sectionLabel} | ${GAME_TITLE}`;
  const description = hasDesc
    ? desc.substring(0, 160)
    : `${entryName} details in ${GAME_TITLE}.`;
  const path = `/db/${section}/${id}`;
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    SUPPORTED_LOCALES,
  );
  return {
    title,
    description,
    keywords: [...KEYWORDS, entryName, sectionLabel],
    alternates: { canonical, languages: languageAlternates },
    openGraph: { title, description, url: canonical, images: [OG_IMAGE] },
  };
}
