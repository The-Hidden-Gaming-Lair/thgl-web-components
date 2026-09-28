"use client";

import { useState } from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@repo/lib";
import { Button } from "@repo/ui/controls";
import { signInUrl, type MyRequests } from "./use-my-requests";

/** Upvote toggle. Signed-out clicks go straight to the Patreon sign-in, which returns here. */
export function VoteButton({
  gameId,
  initialCount,
  my,
  onVoted,
  onError,
  size = "default",
}: {
  gameId: string;
  initialCount: number;
  my: MyRequests | null;
  onVoted?: (gameId: string, voted: boolean) => void;
  onError?: (message: string) => void;
  size?: "default" | "sm";
}) {
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const voted = my?.votes.includes(gameId) ?? false;

  async function vote() {
    if (!my) return;
    if (!my.signedIn) {
      window.location.href = signInUrl();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/stats/requests/${encodeURIComponent(gameId)}/vote`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const body = (await res.json()) as {
        voted?: boolean;
        voteCount?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Vote failed");
      setCount(body.voteCount ?? count);
      onVoted?.(gameId, Boolean(body.voted));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={voted ? "default" : "outline"}
      size={size}
      onClick={vote}
      disabled={busy || !my}
      aria-pressed={voted}
      title={
        !my?.signedIn
          ? "Sign in to vote"
          : voted
            ? "Remove your vote"
            : "Vote for this game"
      }
      className={cn(
        "gap-1 tabular-nums",
        size === "sm" ? "min-w-16" : "min-w-20",
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ChevronUp className="h-4 w-4" />
      )}
      {count}
    </Button>
  );
}
