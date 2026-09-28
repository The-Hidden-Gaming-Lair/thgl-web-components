import {
  corsPreflight,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { getGame, toggleVote } from "@/lib/stats-db";
import { VOTABLE_STATUSES } from "@/lib/stats-types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const { id } = await params;
    const userId = await requireAccount();
    const game = await getGame(id);
    if (!game || !VOTABLE_STATUSES.includes(game.status)) {
      throw new NotFoundError("Game not found");
    }
    return jsonResponse(await toggleVote(id, userId));
  });
}

export function OPTIONS() {
  return corsPreflight();
}
