// Multi-tenant /db/story/[id] route. See the parent page.tsx for the
// dispatch rationale.

import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE } from "@repo/lib";
import { getAppConfig } from "@/lib/get-app-config";
import {
  bpsrStoryEntryMetadata,
  BpsrStoryEntryPage,
} from "@/games/blue-protocol-star-resonance/story-pages";
import { makeEntryPage } from "@/games/drakantos/entry-page";

type Params = Promise<{ id: string; locale?: string }>;

const drakantosStoryEntry = makeEntryPage("story", ["story", "guide"]);

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { id, locale = DEFAULT_LOCALE } = await params;
    return bpsrStoryEntryMetadata(id, locale);
  }
  if (config.name === "drakantos") {
    return drakantosStoryEntry.generateMetadata({ params });
  }
  notFound();
}

export default async function Page({ params }: { params: Params }) {
  const config = await getAppConfig();
  if (config.name === "blue-protocol-star-resonance") {
    const { id, locale = DEFAULT_LOCALE } = await params;
    return BpsrStoryEntryPage({ id, locale });
  }
  if (config.name === "drakantos") {
    return drakantosStoryEntry.Page({ params });
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
