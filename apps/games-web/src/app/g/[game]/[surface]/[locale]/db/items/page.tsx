import { makeCategoryPage } from "@/games/drakantos/category-page";
const { Page, generateMetadata } = makeCategoryPage("items");
export { generateMetadata };
export default Page;

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
