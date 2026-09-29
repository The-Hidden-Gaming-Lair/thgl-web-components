"use client";

import { MessageCircle, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useAccountStore } from "@repo/lib";
import { Button } from "../(controls)";
import { Skeleton } from "../ui/skeleton";
import { useT } from "../(providers)";
import { SingleComment } from "./comment";
import { CommentForm, CommentGuidelines, useNodeComments } from "./comments";

/**
 * "Tips & comments" section at the bottom of a DB entry / guide page.
 *
 * Reuses the map-node comments (api-forge `/comments`, free-form node id —
 * `db:<section>/<id>` or `guide:<type>`). Everything is client-side and
 * deferred until the section nears the viewport, so the server render stays
 * identical for every visitor (pages are edge-cached; comments must never make
 * them per-user) and pages nobody scrolls to the bottom of cost no request.
 * Empty sections collapse to one line with an "Add a tip" button.
 */
export function PageComments({
  id,
  appName,
  className,
}: {
  id: string;
  appName: string;
  className?: string;
}) {
  const t = useT();
  const headingId = useId();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const userId = useAccountStore((state) => state.userId);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const {
    data: comments,
    isLoading,
    error,
  } = useNodeComments(id, appName, visible);
  const count = comments?.length ?? 0;
  const loading = !visible || isLoading;

  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      className={`mt-8 border-t border-slate-800 pt-4 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {t("comments.tips.title", { fallback: "Tips & comments" })}
          {count > 0 && <span className="font-normal">({count})</span>}
        </h2>
        {!composerOpen && !loading && !error && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1 text-xs"
            onClick={() => setComposerOpen(true)}
          >
            <Plus className="h-3 w-3" />
            {t("comments.tips.add", { fallback: "Add a tip" })}
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("comments.tips.error", {
            fallback: "Tips could not be loaded right now.",
          })}
        </p>
      )}
      {!error && loading && <Skeleton className="mt-3 h-8 max-w-md" />}
      {!error && !loading && count === 0 && !composerOpen && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("comments.tips.empty", {
            fallback:
              "No tips yet. Know where to find it, how to use it, or spotted something off? Share it with other players.",
          })}
        </p>
      )}

      {count > 0 && (
        <div className="mt-3 max-w-2xl space-y-4">
          {comments!.map((comment) => (
            <SingleComment key={comment.id} comment={comment} nodeId={id} />
          ))}
        </div>
      )}

      {composerOpen && (
        <div className="mt-3 max-w-2xl">
          {userId && (
            <CommentGuidelines
              label={t("comments.tips.add", { fallback: "Add a tip" })}
            />
          )}
          <CommentForm
            id={id}
            appName={appName}
            autoFocus
            placeholder={t("comments.tips.placeholder", {
              fallback: "Share a tip with other players...",
            })}
            signInMessage={t("comments.tips.signIn", {
              fallback: "Sign in to share a tip. No subscription needed.",
            })}
            onPosted={() => setComposerOpen(false)}
          />
        </div>
      )}
    </section>
  );
}
