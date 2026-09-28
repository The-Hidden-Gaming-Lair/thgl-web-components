import { corsPreflight, handle, jsonResponse } from "@/lib/api-errors";
import { getUserIdFromRequest } from "@/lib/auth";
import { requireStatusAdmin } from "@/lib/status-admin";
import { getUserVotes, listPending } from "@/lib/stats-db";

/**
 * Per-user state for /requests: my votes, pending (unreviewed) requests —
 * every one for admins, my own otherwise — and the admin flag.
 * no-store (next.config.js): the userId cookie is deterministic.
 */
export async function GET() {
  return handle(async () => {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      return jsonResponse({
        signedIn: false,
        votes: [],
        isAdmin: false,
        pending: [],
      });
    }
    const isAdmin = Boolean(await requireStatusAdmin());
    const [votes, pending] = await Promise.all([
      getUserVotes(userId),
      listPending(isAdmin ? undefined : userId),
    ]);
    return jsonResponse({ signedIn: true, votes, isAdmin, pending });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
