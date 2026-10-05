import {
  fetchDict,
  fetchVersion,
  getMapNameFromVersion,
  getOpenGraphImageUrl,
  resolveForgeUrl,
} from "@repo/lib";
import { ImageResponse } from "next/og";
import { getAppConfig } from "@/lib/get-app-config";

// Map OG image, served at the public URL /[locale/]maps/<Map>/opengraph-image.
//
// A plain route handler instead of the `opengraph-image.tsx` file convention:
// Next builds the og:image URL of the file convention from the INTERNAL route
// path (/g/<game>/<surface>/<locale>/…, see src/lib/route-params.ts), which is
// not publicly reachable. The convention's image only ever won on map URLs that
// don't resolve (308 redirects, 404s) — real map pages set their CDN image in
// generateMetadata — so pages no longer reference it; the route stays for any
// previously shared link.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ map: string }> },
) {
  const { map } = await params;
  const config = await getAppConfig();
  const [version, dict] = await Promise.all([
    fetchVersion(config.name),
    fetchDict(config.name),
  ]);
  const mapName = getMapNameFromVersion(version, map, dict);
  // satori fetches the <img> itself server-side — needs an absolute URL
  // in dev proxy mode (forge URLs are relative there).
  const imageUrl = await resolveForgeUrl(
    getOpenGraphImageUrl(config.name, mapName!),
  );

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img src={imageUrl} height="630" width="1200" />
    </div>,
  );
}
