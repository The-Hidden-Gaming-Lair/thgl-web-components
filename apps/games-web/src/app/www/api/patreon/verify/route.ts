import { type NextRequest } from "next/server";
import { CORS_HEADERS } from "@/games/thgl-web/lib/patreon";
import { verifySecretPOST } from "@/lib/verify-secret";

// App-agnostic, cookie-free secret verification — used by the THGLApp/web
// session self-heal (reverifyAccountSecret in @repo/lib). Same handler as the
// legacy /api/patreon/overwolf route.
export const maxDuration = 25;

export async function POST(request: NextRequest) {
  return verifySecretPOST(request);
}

export function OPTIONS() {
  return Response.json({}, { headers: CORS_HEADERS });
}
