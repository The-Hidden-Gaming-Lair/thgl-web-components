// Multi-tenant /db/story route. Dispatches to the per-game implementation
// based on the resolved AppConfig. Currently hosts BPSR's story explorer
// and Drakantos's story chapters.

import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import {
  bpsrStoryMetadata,
  BpsrStoryListPage,
} from "@/games/blue-protocol-star-resonance/story-pages";
import { makeCategoryPage } from "@/games/drakantos/category-page";

type PageProps = { params: Promise<{ locale?: string }> };

const drakantosStory = makeCategoryPage("story", ["guide"]);

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { locale = DEFAULT_LOCALE } = await props.params;
    return bpsrStoryMetadata(locale);
  }
  if (config.name === "drakantos") {
    return drakantosStory.generateMetadata(props);
  }
  notFound();
}

export default async function Page(props: PageProps) {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { locale = DEFAULT_LOCALE } = await props.params;
    return BpsrStoryListPage({ locale });
  }
  if (config.name === "drakantos") {
    return drakantosStory.Page(props);
  }
  notFound();
}

// Cached in Next's page cache (cache-handler.cjs): rendered once per pod and
// game data version, then served without re-rendering — see
// src/lib/route-params.ts. No dynamic APIs below this route; plain fetches stay
// uncached so a re-render after a data update always sees fresh data.
export const dynamic = "force-static";
export const fetchCache = "default-no-store";
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}
