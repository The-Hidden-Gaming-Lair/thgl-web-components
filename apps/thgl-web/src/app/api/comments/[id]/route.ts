import { sql } from "@vercel/postgres";
import { type NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { postToDiscord } from "@repo/lib";
import { isSpecialUser } from "@/lib/patreon";

const DEFAULT_HEADERS = {
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    ...DEFAULT_HEADERS,
    "Access-Control-Allow-Origin": origin,
  };
  const { id: commentId } = await params;

  const formData = await request.formData();
  const userIdValue = formData.get("userId");

  if (!userIdValue) {
    return Response.json(
      { error: "No userId provided" },
      { status: 400, headers },
    );
  }

  let userId: string;
  try {
    userId = verify(userIdValue.toString(), process.env.JWT_SECRET!) as string;
  } catch (error) {
    return Response.json(
      { error: "Invalid or expired userId token" },
      { status: 401, headers },
    );
  }

  const query = isSpecialUser(userId)
    ? sql`DELETE FROM comments WHERE id = ${commentId} RETURNING *`
    : sql`DELETE FROM comments WHERE id = ${commentId} AND user_id = ${userId} RETURNING *`;
  const { rows } = await query;
  if (rows.length === 0) {
    return Response.json(
      {
        error:
          "Comment not found or user does not have permission to delete this comment",
      },
      { status: 404, headers },
    );
  }
  // Delete votes associated with the comment
  await sql`DELETE FROM comment_votes WHERE comment_id = ${commentId}`;

  await postToDiscord(
    `Deleted comment ${commentId} by ${userId}`,
    process.env.DISCORD_WEBHOOK_COMMENTS!,
    "THGL",
  );
  return Response.json(rows, { headers });
}

export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const headers = {
    ...DEFAULT_HEADERS,
    "Access-Control-Allow-Origin": origin,
  };
  return Response.json({}, { headers });
}
