"use client";

import { useState } from "react";
import { useMyRequests } from "./use-my-requests";
import { VoteButton } from "./vote-button";

export function GameVote({
  gameId,
  voteCount,
}: {
  gameId: string;
  voteCount: number;
}) {
  const { state, setState } = useMyRequests();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <VoteButton
          gameId={gameId}
          initialCount={voteCount}
          my={state}
          onError={setError}
          onVoted={(id, voted) =>
            setState((s) =>
              s
                ? {
                    ...s,
                    votes: voted
                      ? [...s.votes, id]
                      : s.votes.filter((v) => v !== id),
                  }
                : s,
            )
          }
        />
        <span className="text-sm text-muted-foreground">
          {state && !state.signedIn
            ? "Sign in to vote for this game"
            : "Votes help me pick which game to support next"}
        </span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
