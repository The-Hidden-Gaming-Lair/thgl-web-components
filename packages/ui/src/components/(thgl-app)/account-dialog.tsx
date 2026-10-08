"use client";
import { defaultPerks, games, TH_GL_URL, useAccountStore } from "@repo/lib";
import { Button } from "../(controls)";
import Cookies from "js-cookie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { Eye, ExternalLink, Shield, Star, Ticket, Zap } from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";
import { useUnlockWithSecret } from "../(header)/use-unlock-with-secret";

const PERK_CONFIG = [
  { key: "adRemoval" as const, label: "Ad-Free", icon: Shield, tier: "Pro+" },
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

/** Titles of the invite-only companions the account is invited to. */
function inviteTitles(invites: string[]): string[] {
  return invites.map((id) => games.find((game) => game.id === id)?.title ?? id);
}

/**
 * Invite-only companions the account is invited to (games.ts
 * `companion.inviteOnly`). Renders nothing when there are none.
 */
function InvitedSection({ invites }: { invites: string[] }) {
  const titles = inviteTitles(invites);
  if (titles.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Invited
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {titles.map((title) => (
          <div
            key={title}
            className="flex items-center gap-2 text-xs text-foreground py-1"
          >
            <Ticket className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerksGrid({ perks }: { perks: Record<string, boolean> }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {PERK_CONFIG.map((perk) => {
        const active = perks[perk.key];
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
  );
}

function PricingLink() {
  return (
    <Link
      href={`${TH_GL_URL}/support-me`}
      target="_blank"
      prefetch={false}
      className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline"
    >
      <Star className="w-3.5 h-3.5" />
      View tiers & pricing
      <ExternalLink className="w-3 h-3" />
    </Link>
  );
}

/**
 * Supporter Key sign-in: accounts without a Patreon login (Tebex purchases,
 * e.g. the China Alipay / WeChat Pay checkout) restore themselves in the
 * Companion App with the key from their www account page. The app has its
 * own cookie store, so a website sign-in doesn't carry over.
 */
function SupporterKeyForm() {
  const [key, setKey] = useState("");
  const { unlock, loading } = useUnlockWithSecret();
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Have a Supporter Key? / 有支持者密钥？
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void unlock(key);
        }}
        className="flex gap-2 mt-2"
      >
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value.trim())}
          placeholder="Paste your Supporter Key / 粘贴你的支持者密钥"
          className="text-xs h-8"
        />
        <Button
          type="submit"
          size="sm"
          className="h-8 shrink-0"
          disabled={key.length === 0 || loading}
        >
          Unlock
        </Button>
      </form>
    </details>
  );
}

export function AccountDialog() {
  const account = useAccountStore();

  if (!account.userId) {
    return (
      <Dialog
        open={account.showUserDialog}
        onOpenChange={account.setShowUserDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Status</DialogTitle>
            <DialogDescription className="sr-only">
              View your account status and supporter perks.
            </DialogDescription>
          </DialogHeader>
          <section className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This app is free and ad-supported. Support the project on Patreon
              to remove ads and unlock features across all TH.GL apps.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Perks
              </p>
              <PerksGrid perks={defaultPerks} />
            </div>
            <Separator />
            <PricingLink />
            <SupporterKeyForm />
          </section>
          <DialogFooter>
            <Link href="https://www.patreon.com/home" target="_blank" passHref>
              <Button type="button" variant="outline">
                Open Patreon
              </Button>
            </Link>
            {/* Unchanged: opens the Patreon auth in a new window. */}
            <Link
              href="/authenticate"
              passHref
              target="_blank"
              prefetch={false}
            >
              <Button>Authenticate with Patreon</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Dialog
      open={account.showUserDialog}
      onOpenChange={account.setShowUserDialog}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Account Status</DialogTitle>
          <DialogDescription className="sr-only">
            View your account status and supporter perks.
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-4">
          <div>
            <p className="font-bold text-sm">Account ID</p>
            <p className="text-muted-foreground">{account.decryptedUserId}</p>
          </div>
          <div>
            <p className="font-bold text-sm">Tier</p>
            <p className="text-primary">
              {/* Special is server-resolved (PATREON_SPECIAL_USERS) — perks
                  alone can't distinguish it from Elite. */}
              {/* Every paid tier includes comments; an invited non-supporter
                  has the invite perks (preview/premium) but no comments. */}
              {account.isSpecial
                ? "Special"
                : !account.perks.comments && account.invites.length > 0
                  ? "Invited"
                  : account.perks.previewReleaseAccess
                    ? "Elite"
                    : account.perks.adRemoval
                      ? "Pro"
                      : account.perks.comments
                        ? "Enthusiast"
                        : "None"}
            </p>
          </div>
          <InvitedSection invites={account.invites} />
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Perks
            </p>
            <PerksGrid perks={account.perks} />
          </div>
          <PricingLink />
        </section>
        <DialogFooter>
          <Link href="https://www.patreon.com/home" target="_blank" passHref>
            <Button type="button" variant="outline">
              Open Patreon
            </Button>
          </Link>
          <Button
            type="button"
            variant="destructive"
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
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
