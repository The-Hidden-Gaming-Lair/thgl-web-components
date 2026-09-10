import { notFound } from "next/navigation";
import { games, isInviteOnlyCompanion } from "@repo/lib";
import { requireStatusAdmin } from "@/lib/status-admin";
import { listInvites } from "@/lib/invites";
import { InvitesAdminPanel } from "./invites-admin-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Invites - The Hidden Gaming Lair",
  robots: { index: false, follow: false },
};

/**
 * Admin page for invite-only companion access (lib/invites.ts). Server-guarded:
 * anyone who is not a PATREON_SPECIAL_USERS admin gets the regular 404, so the
 * page is invisible rather than a login wall.
 */
export default async function InvitesAdminPage() {
  const adminId = await requireStatusAdmin();
  if (!adminId) {
    notFound();
  }
  const inviteOnlyGames = games
    .filter(isInviteOnlyCompanion)
    .map((g) => ({ id: g.id, title: g.title }));
  const invites = await listInvites().catch(() => null);

  return (
    <section className="space-y-8 px-4 pt-10 pb-20 max-w-3xl mx-auto">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <h1 className="text-3xl font-bold">Companion invites</h1>
        <p className="text-sm text-muted-foreground">
          Accounts allowed to open invite-only companion apps. Enter the Patreon
          user id shown in the account dialog. Changes apply the next time the
          account verifies (sign-in, app start, or the periodic perks refresh).
          Invited accounts also get Premium + Preview Access.
        </p>
      </div>
      {invites === null ? (
        <div className="bg-muted/30 rounded-lg p-6 text-center">
          <p className="text-muted-foreground">
            Invite store unavailable. Please try again shortly.
          </p>
        </div>
      ) : (
        <InvitesAdminPanel games={inviteOnlyGames} invites={invites} />
      )}
    </section>
  );
}
