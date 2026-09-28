import {
  corsPreflight,
  ForbiddenError,
  handle,
  jsonResponse,
  NotFoundError,
} from "@/lib/api-errors";
import { requireAccount } from "@/lib/auth";
import { requireStatusAdmin } from "@/lib/status-admin";
import { deleteComment, getCommentOwner } from "@/lib/stats-db";

/**
 * Delete a th.gl comment: its author or an admin (PATREON_SPECIAL_USERS).
 * Soft delete; the Discord bot removes the copy in the game's
 * #game-requests thread on its next run.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  return handle(async () => {
    const { id, commentId } = await params;
    const userId = await requireAccount();
    const comment = await getCommentOwner(commentId);
    if (!comment || comment.gameId !== id || comment.deleted) {
      throw new NotFoundError("Comment not found");
    }
    if (comment.userId !== userId && !(await requireStatusAdmin())) {
      throw new ForbiddenError("You can only delete your own comments");
    }
    await deleteComment(commentId);
    return jsonResponse({ ok: true });
  });
}

export function OPTIONS() {
  return corsPreflight();
}
