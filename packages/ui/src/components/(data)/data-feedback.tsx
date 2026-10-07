"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_FORGE_URL, resilientFetch, useAccountStore } from "@repo/lib";
import { Button } from "../(controls)";
import { Textarea } from "../ui/textarea";
import { useT } from "../(providers)";
import { errorFromResponse } from "./comment-utils";

type Vote = "up" | "down";

const MAX_TEXT = 500;

// Per-browser memory of the answer, so a revisit shows "thanks" instead of
// asking again. Convenience only — the server dedups per visitor anyway.
const storageKey = (appName: string, targetId: string) =>
  `thgl-data-feedback:${appName}:${targetId}`;

// Stored as "up" | "down" | "down+note" (a note was already sent).
function readStored(
  appName: string,
  targetId: string,
): { vote: Vote | null; noted: boolean } {
  try {
    const v = localStorage.getItem(storageKey(appName, targetId)) ?? "";
    const [vote, note] = v.split("+");
    return {
      vote: vote === "up" || vote === "down" ? vote : null,
      noted: note === "note",
    };
  } catch {
    return { vote: null, noted: false };
  }
}

function writeStored(
  appName: string,
  targetId: string,
  vote: Vote,
  noted = false,
) {
  try {
    localStorage.setItem(
      storageKey(appName, targetId),
      noted ? `${vote}+note` : vote,
    );
  } catch {
    /* private mode / blocked storage: fine, the widget just asks again */
  }
}

async function sendReport(body: {
  appId: string;
  targetId: string;
  vote: Vote;
  text?: string;
  userId?: string | null;
}) {
  const res = await resilientFetch(`${API_FORGE_URL}/reports`, {
    method: "POST",
    body: JSON.stringify({
      ...body,
      userId: body.userId ?? undefined,
      pageUrl: typeof window !== "undefined" ? window.location.href : undefined,
    }),
  });
  if (!res.ok) throw await errorFromResponse(res, "Failed to send feedback");
}

/**
 * "Was this accurate?" thumbs up/down for a data page (DB entry, map marker),
 * with an optional short note after a thumbs-down. No sign-in required —
 * api-forge rate-limits per visitor. `targetId` is free-form: `db:<section>/<id>`
 * for DB entries, the node id for markers.
 */
export function DataFeedback({
  appName,
  targetId,
  className,
}: {
  appName: string;
  targetId: string;
  className?: string;
}) {
  const t = useT();
  const userId = useAccountStore((state) => state.userId);
  const [vote, setVote] = useState<Vote | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [noteSent, setNoteSent] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // Read after mount: localStorage is browser-only and the server HTML must
  // not depend on it (hydration).
  useEffect(() => {
    const stored = readStored(appName, targetId);
    setVote(stored.vote);
    setText("");
    setNoteSent(stored.noted);
    setShowNote(false);
  }, [appName, targetId]);

  const castVote = async (next: Vote) => {
    if (sending || next === vote) return;
    setSending(true);
    try {
      await sendReport({ appId: appName, targetId, vote: next, userId });
      setVote(next);
      writeStored(appName, targetId, next);
      setShowNote(next === "down");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send feedback",
      );
    } finally {
      setSending(false);
    }
  };

  const sendNote = async () => {
    const note = text.trim();
    if (!vote || !note || sending) return;
    setSending(true);
    try {
      await sendReport({ appId: appName, targetId, vote, text: note, userId });
      setNoteSent(true);
      setShowNote(false);
      writeStored(appName, targetId, vote, true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send feedback",
      );
    } finally {
      setSending(false);
    }
  };

  const thanks = noteSent
    ? t("feedback.thanksNote", {
        fallback: "Thanks! We'll take a look.",
      })
    : t("feedback.thanks", { fallback: "Thanks for the feedback!" });

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>
          {vote
            ? thanks
            : t("feedback.question", { fallback: "Was this accurate?" })}
        </span>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-1.5 ${vote === "up" ? "text-amber-300" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => castVote("up")}
            disabled={sending}
            aria-pressed={vote === "up"}
            aria-label={t("feedback.yes", { fallback: "Yes, accurate" })}
            title={t("feedback.yes", { fallback: "Yes, accurate" })}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-1.5 ${vote === "down" ? "text-amber-300" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => castVote("down")}
            disabled={sending}
            aria-pressed={vote === "down"}
            aria-label={t("feedback.no", {
              fallback: "No, something is wrong",
            })}
            title={t("feedback.no", { fallback: "No, something is wrong" })}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        {vote === "down" && !showNote && !noteSent && (
          <button
            type="button"
            className="text-amber-300 underline-offset-2 hover:underline"
            onClick={() => setShowNote(true)}
          >
            {t("feedback.addNote", { fallback: "Tell us what's wrong" })}
          </button>
        )}
      </div>
      {showNote && (
        <form
          className="mt-2 max-w-md space-y-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendNote();
          }}
        >
          <Textarea
            className="min-h-0 resize-none text-xs"
            rows={2}
            maxLength={MAX_TEXT}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("feedback.notePlaceholder", {
              fallback: "What's wrong or missing? (optional)",
            })}
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={sending || !text.trim()}
            >
              {sending
                ? t("feedback.sending", { fallback: "Sending..." })
                : t("feedback.send", { fallback: "Send" })}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setShowNote(false)}
            >
              {t("feedback.skip", { fallback: "Skip" })}
            </Button>
            <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
              {text.length}/{MAX_TEXT}
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
