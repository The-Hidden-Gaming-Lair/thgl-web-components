import { sql } from "@vercel/postgres";
import { type NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { postToDiscord } from "@repo/lib";

const DEFAULT_HEADERS = {
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS, DELETE",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "*",
};

export async function PUT(
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
  const voteType = formData.get("voteType");

  if (!userIdValue) {
    return Response.json(
      { error: "No userId provided" },
      { status: 400, headers },
    );
  }

  if (!voteType || !["upvote", "downvote"].includes(voteType.toString())) {
    return Response.json(
      { error: "Invalid voteType" },
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

  const commentAuthorQuery = sql`SELECT user_id FROM comments WHERE id = ${commentId}`;
  const { rows: authorRows } = await commentAuthorQuery;

  if (authorRows.length === 0) {
    return Response.json(
      { error: "Comment not found" },
      { status: 404, headers },
    );
  }

  const commentAuthorId = authorRows[0].user_id as string;

  if (commentAuthorId === userId) {
    return Response.json(
      { error: "You cannot vote on your own comment" },
      { status: 403, headers },
    );
  }

  const query = sql`
      INSERT INTO comment_votes (user_id, comment_id, vote_type)
      VALUES (${userId}, ${commentId}, ${voteType.toString()})
      ON CONFLICT (user_id, comment_id)
      DO UPDATE SET vote_type = EXCLUDED.vote_type
      RETURNING *`;

  const { rows } = await query;

  if (rows.length === 0) {
    return Response.json(
      { error: "Failed to add or update vote" },
      { status: 500, headers },
    );
  }

  await postToDiscord(
    `Updated vote: ${voteType.toString()} for comment ${commentId} by ${userId}`,
    process.env.DISCORD_WEBHOOK_COMMENTS!,
    "THGL",
  );

  return Response.json(rows[0], { headers });
}

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

  const query = sql`DELETE FROM comment_votes WHERE user_id = ${userId} AND comment_id = ${commentId} RETURNING *`;
  const { rows } = await query;
  if (rows.length === 0) {
    return Response.json(
      {
        error:
          "Comment not found or user does not have permission to delete this vote",
      },
      { status: 404, headers },
    );
  }
  await postToDiscord(
    `Deleted comment vote ${commentId} by ${userId}`,
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
