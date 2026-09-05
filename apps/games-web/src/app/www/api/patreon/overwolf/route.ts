import { type NextRequest } from "next/server";
import { CORS_HEADERS } from "@/games/thgl-web/lib/patreon";
import { verifySecretPOST } from "@/lib/verify-secret";

// Legacy route name kept for shipped Overwolf apps (and the manual
// secret-entry dialog). New callers use /api/patreon/verify — same handler
// (see lib/verify-secret.ts).
export const maxDuration = 25;

export async function POST(request: NextRequest) {
  return verifySecretPOST(request);
}

export function OPTIONS() {
  return Response.json({}, { headers: CORS_HEADERS });
}
