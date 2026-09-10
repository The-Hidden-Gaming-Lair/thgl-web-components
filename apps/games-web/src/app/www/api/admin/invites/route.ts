import { games, isInviteOnlyCompanion } from "@repo/lib";
import { requireStatusAdmin } from "@/lib/status-admin";
import {
  addInvite,
  listInvites,
  normalizeInviteSubject,
  removeInvite,
} from "@/lib/invites";

/**
 * Admin CRUD for invite-only companion access (lib/invites.ts). Admin = the
 * PATREON_SPECIAL_USERS cookie check shared with the status page. Only game
 * ids whose companion is `inviteOnly` are accepted, so a typo can't create
 * dangling rows for public games.
 */

function inviteOnlyGameIds(): Set<string> {
  return new Set(games.filter(isInviteOnlyCompanion).map((g) => g.id));
}

export async function GET(request: Request) {
  if (!(await requireStatusAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const app = new URL(request.url).searchParams.get("app") ?? undefined;
  try {
    const invites = await listInvites(app);
    return Response.json({ invites });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const adminId = await requireStatusAdmin();
  if (!adminId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { app?: string; subject?: string; note?: string | null };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const subject = normalizeInviteSubject(body.subject ?? "");
  if (!body.app || !inviteOnlyGameIds().has(body.app)) {
    return Response.json(
      { error: "app must be an invite-only companion game id" },
      { status: 400 },
    );
  }
  if (!subject) {
    return Response.json(
      { error: "subject must be a numeric Patreon user id" },
      { status: 400 },
    );
  }
  try {
    await addInvite({
      app: body.app,
      subject,
      note: body.note?.trim() || null,
      createdBy: adminId,
    });
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireStatusAdmin())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { app?: string; subject?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.app || !body.subject?.trim()) {
    return Response.json({ error: "app + subject required" }, { status: 400 });
  }
  try {
    await removeInvite(body.app, body.subject);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
