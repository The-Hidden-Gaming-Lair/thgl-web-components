import { requireStatusAdmin } from "@/lib/status-admin";

// Whether the caller is a status admin. The status PAGE is edge-cached and
// shared by everyone, so it can't render per-user content itself — its admin
// panel asks here client-side instead. no-store (next.config.js): the answer
// depends on the caller's userId cookie.
export const dynamic = "force-dynamic";

export async function GET() {
  const adminId = await requireStatusAdmin();
  return Response.json(
    { admin: adminId !== null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
