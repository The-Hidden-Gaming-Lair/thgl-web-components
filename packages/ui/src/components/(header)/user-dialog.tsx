"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  defaultPerks,
  isOverwolf,
  type Perks,
  TH_GL_URL,
  useAccountStore,
} from "@repo/lib";
import { Badge, Button } from "../(controls)";
import { Separator } from "../ui/separator";
import Cookies from "js-cookie";
import { ExternalAnchor } from "./external-anchor";
import { Input } from "../ui/input";
import { useMemo, useState } from "react";
import { ExternalLink, LogOut, Shield, Star, Eye, Zap } from "lucide-react";
import { toast } from "sonner";
import { toSvg } from "jdenticon";

const PERK_CONFIG = [
  {
    key: "adRemoval" as const,
    label: "Ad-Free",
    icon: Shield,
    tier: "Pro+",
  },
  {
    key: "premiumFeatures" as const,
    label: "Premium",
    icon: Zap,
    tier: "Pro+",
  },
  {
    key: "previewReleaseAccess" as const,
    label: "Preview Access",
    icon: Eye,
    tier: "Elite",
  },
];

function AuthenticatedView() {
  const account = useAccountStore();
  const displayName = account.username || "User";

  const avatarSVG = useMemo(
    () =>
      account.avatarUrl || !account.decryptedUserId
        ? null
        : toSvg(account.decryptedUserId, 48),
    [account.avatarUrl, account.decryptedUserId],
  );

  const activePerks = PERK_CONFIG.filter((p) => account.perks[p.key]);
  const hasPerks = activePerks.length > 0;

  // isSpecial is server-resolved (PATREON_SPECIAL_USERS) and rides on the
  // account payload — perks alone can't distinguish Special from Elite.
  const currentTier = account.isSpecial
    ? "Special"
    : account.perks.previewReleaseAccess
      ? "Elite"
      : account.perks.adRemoval
        ? "Pro"
        : account.perks.comments
          ? "Enthusiast"
          : null;

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          {account.avatarUrl ? (
            <img
              src={account.avatarUrl}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : avatarSVG ? (
            <div
              className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30"
              dangerouslySetInnerHTML={{ __html: avatarSVG }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/30">
              <Star className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{displayName}</p>
          {currentTier ? (
            <p className="text-xs text-primary">{currentTier}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No active tier</p>
          )}
        </div>
      </div>

      {/* Perks */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {PERK_CONFIG.map((perk) => {
            const active = account.perks[perk.key];
            return (
              <div
                key={perk.key}
                className={
                  active
                    ? "flex items-center gap-2 text-xs text-foreground py-1"
                    : "flex items-center gap-2 text-xs text-muted-foreground/40 py-1"
                }
              >
                <perk.icon
                  className={
                    active
                      ? "w-3.5 h-3.5 text-primary shrink-0"
                      : "w-3.5 h-3.5 shrink-0"
                  }
                />
                <span>{perk.label}</span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">
                  {perk.tier}
                </span>
              </div>
            );
          })}
        </div>
        {!hasPerks && (
          <ExternalAnchor
            href={`${TH_GL_URL}/support-me`}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Star className="w-3 h-3" />
            View tiers & pricing
            <ExternalLink className="w-3 h-3" />
          </ExternalAnchor>
        )}
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <ExternalAnchor
          href={`${TH_GL_URL}/support-me/account`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Manage profile
          <ExternalLink className="w-3 h-3" />
        </ExternalAnchor>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            Cookies.remove("userId");
            account.setAccount({
              userId: null,
              decryptedUserId: null,
              email: null,
              perks: defaultPerks,
              username: null,
              avatarUrl: null,
            });
          }}
        >
          <LogOut className="w-3 h-3 mr-1" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function UnauthenticatedView() {
  const account = useAccountStore();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (loading) return;
    setLoading(true);
    e.preventDefault();
    const response = await fetch(`${TH_GL_URL}/api/patreon/overwolf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    try {
      const body = (await response.json()) as {
        expiresIn: number;
        decryptedUserId: string;
        email: string;
        secret?: string;
      } & Perks;
      if (!response.ok) {
        if (response.status === 403) {
          account.setAccount({
            userId,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
          toast("User is not a subscriber");
        } else if (response.status === 404) {
          account.setAccount({
            userId: null,
            decryptedUserId: null,
            email: null,
            perks: defaultPerks,
            username: null,
            avatarUrl: null,
          });
          toast("Invalid secret");
        } else if ("error" in body && typeof body.error === "string") {
          toast(body.error);
        }
      } else {
        account.setAccount({
          // Prefer the server-minted enriched secret (carries the
          // rotated Patreon token) — keeps unlocking working when the
          // token store is unreachable.
          userId: body.secret ?? userId,
          decryptedUserId: body.decryptedUserId,
          email: body.email,
          perks: {
            adRemoval: body.adRemoval,
            previewReleaseAccess: body.previewReleaseAccess,
            comments: body.comments,
            premiumFeatures: body.premiumFeatures,
          },
          username: null,
          avatarUrl: null,
        });
        toast("Subscription enabled");
      }
    } catch {
      toast("An error occurred. Please try again later.");
    }
    setLoading(false);
  };

  // Production: round-trip through www.th.gl's authorize route (which
  // supports the return_to state param). Dev: stay on the current
  // tenant so the cookie ends up host-scoped and signed-in state
  // actually applies to whatever subdomain the user was browsing.
  // The /authenticate middleware handler is open to any tenant in dev
  // (see middleware.ts).
  const returnTo = typeof window !== "undefined" ? window.location.href : "";
  const authUrl =
    process.env.NODE_ENV === "development" && typeof window !== "undefined"
      ? `/authenticate?return_to=${encodeURIComponent(returnTo)}`
      : `${TH_GL_URL}/api/patreon/authorize?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <div className="space-y-4">
      {/* Value prop */}
      <p className="text-sm text-muted-foreground">
        Support the project to unlock features across all TH.GL apps.
      </p>

      {/* Perks list */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Perks
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PERK_CONFIG.map((perk) => (
            <div
              key={perk.key}
              className="flex items-center gap-2 text-xs text-muted-foreground py-1"
            >
              <perk.icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{perk.label}</span>
              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                {perk.tier}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* New user: see tiers & pricing */}
      <ExternalAnchor
        href={`${TH_GL_URL}/support-me`}
        className="flex items-center justify-center gap-1.5 w-full text-sm font-medium text-primary hover:underline"
      >
        <Star className="w-3.5 h-3.5" />
        View tiers & pricing
        <ExternalLink className="w-3 h-3" />
      </ExternalAnchor>

      {/* Existing user: sign in */}
      <Button className="w-full" asChild>
        <a href={authUrl}>Already a supporter? Sign In</a>
      </Button>

      {/* Overwolf secret form — Overwolf can't sign in directly, so users
          unlock with a one-time secret copied from the web account page.
          Spell out the steps; "paste your secret" alone confused users. */}
      {isOverwolf && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium">Unlock manually (Overwolf)</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
              <li>Become a Pro/Elite supporter on Patreon.</li>
              <li>
                Open the{" "}
                <ExternalAnchor
                  href={`${TH_GL_URL}/support-me/account`}
                  className="text-primary hover:underline"
                >
                  account page
                </ExternalAnchor>{" "}
                and authenticate with Patreon.
              </li>
              <li>
                Find this game and click{" "}
                <span className="font-medium">Copy Secret</span>.
              </li>
              <li>Paste it below and Unlock.</li>
            </ol>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Paste your secret here"
                className="text-xs h-8"
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 shrink-0"
                disabled={userId.length === 0 || loading}
              >
                Unlock
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export function UserDialog() {
  const account = useAccountStore();

  return (
    <Dialog
      open={account.showUserDialog}
      onOpenChange={account.setShowUserDialog}
    >
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {account.userId ? "Account" : "Sign In"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Manage your account and sign-in.
          </DialogDescription>
        </DialogHeader>
        {account.userId ? <AuthenticatedView /> : <UnauthenticatedView />}
      </DialogContent>
    </Dialog>
  );
}
