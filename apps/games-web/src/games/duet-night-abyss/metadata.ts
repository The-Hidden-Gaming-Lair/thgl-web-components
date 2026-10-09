import type { Metadata } from "next";
import { getMetadataAlternates, type Dict } from "@repo/lib";
import { duetNightAbyss } from "@/configs/duet-night-abyss";
import { questLabel } from "./quests";

const APP = duetNightAbyss;
const GAME_TITLE = APP.title;
const OG_IMAGE = "https://duetnightabyss.th.gl/opengraph-image.jpg";

function buildMeta({
  locale,
  path,
  title,
  description,
  keywords,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
}): Metadata {
  const { canonical, languageAlternates } = getMetadataAlternates(
    path,
    locale,
    APP.supportedLocales,
  );
  return {
    title,
    description,
    keywords,
    alternates: { canonical, languages: languageAlternates },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [OG_IMAGE],
    },
  };
}

export function questsIndexMetadata(locale: string, dict: Dict): Metadata {
  return buildMeta({
    locale,
    path: "/db/quests",
    title: questLabel(dict, "metaTitle", { game: GAME_TITLE }),
    description: questLabel(dict, "metaDescription"),
    keywords: [...APP.keywords, "Quests", "Quest Chain", "Walkthrough"],
  });
}

export function questDetailMetadata(
  id: string,
  questName: string,
  locale: string,
  dict: Dict,
): Metadata {
  return buildMeta({
    locale,
    path: `/db/quests/${id}`,
    title: `${questName} – ${questLabel(dict, "title")} – ${GAME_TITLE}`,
    description: questLabel(dict, "detailMetaDescription", { name: questName }),
    keywords: [...APP.keywords, "Quests", questName],
  });
}
