"use client";

import { CircleUser } from "lucide-react";
import Link from "next/link";
import { cn, useAccountStore } from "@repo/lib";
import { Button } from "@repo/ui/controls";

/**
 * Header account entry point — same look as the account button on the
 * game pages ((header)/user.tsx: outline icon Button, CircleUser tinted
 * primary when signed in), but linking to the account page instead of
 * opening the user dialog.
 */
export function AccountLink() {
  const userId = useAccountStore((state) => state.userId);
  const username = useAccountStore((state) => state.username);

  return (
    <Button
      asChild
      size="icon"
      variant="outline"
      title={userId ? (username ?? "Account") : "Sign in"}
    >
      <Link
        href="/support-me/account"
        prefetch={false}
        aria-label={userId ? "Account" : "Sign in"}
      >
        <CircleUser className={cn("h-4 w-4", userId && "text-primary")} />
      </Link>
    </Button>
  );
}
