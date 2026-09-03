"use client";
import { defaultPerks, TH_GL_URL, useAccountStore } from "@repo/lib";
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
import { Eye, ExternalLink, Shield, Star, Zap } from "lucide-react";

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
              {account.isSpecial
                ? "Special"
                : account.perks.previewReleaseAccess
                  ? "Elite"
                  : account.perks.adRemoval
                    ? "Pro"
                    : account.perks.comments
                      ? "Enthusiast"
                      : "None"}
            </p>
          </div>
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
