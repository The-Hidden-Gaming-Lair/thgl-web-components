"use client";

import {
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Pencil,
  X,
  Check,
  Flag,
} from "lucide-react";
import { Button } from "../(controls)";
import { API_FORGE_URL, resilientFetch, useAccountStore } from "@repo/lib";
import { toSvg } from "jdenticon";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import Markdown from "markdown-to-jsx";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { CommentImageUpload } from "./comment-image-upload";
import { errorFromResponse } from "./comment-utils";

export type CommentImage = {
  id: number;
  url: string;
  sort_order: number;
};

export type Comment = {
  id: number;
  app_id: string;
  node_id: string;
  text: string;
  username: string;
  user_id: string;
  avatar_url: string | null;
  images: CommentImage[];
  created_at: string;
  updated_at: string;
  upvotes: number;
  downvotes: number;
};

// api-forge stores SQLite CURRENT_TIMESTAMP ("YYYY-MM-DD HH:MM:SS", UTC with
// no zone marker); `new Date()` would read it as LOCAL time, so a comment just
// posted showed as "2h ago" in UTC+2.
function parseApiDate(dateStr: string): number {
  const utc = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)
    ? `${dateStr.replace(" ", "T")}Z`
    : dateStr;
  return new Date(utc).getTime();
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = parseApiDate(dateStr);
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function SingleComment({
  comment,
  nodeId,
}: {
  comment: Comment;
  nodeId: string;
}) {
  const { mutate } = useSWRConfig();
  const userId = useAccountStore((state) => state.userId);
  const decryptedUserId = useAccountStore((state) => state.decryptedUserId);
  const isOwner = decryptedUserId === comment.user_id;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editKeepImageIds, setEditKeepImageIds] = useState<number[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [confirmReport, setConfirmReport] = useState(false);
  const [reported, setReported] = useState(false);
  const reportTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Vote mutation
  const { trigger: triggerVote, isMutating: isVoting } = useSWRMutation(
    `/comments/${nodeId}/votes`,
    async (_, { arg }: { arg: "upvote" | "downvote" }) => {
      if (!userId) throw new Error("Not logged in");
      const res = await resilientFetch(
        `${API_FORGE_URL}/comments/${comment.id}/votes`,
        {
          method: "PUT",
          body: JSON.stringify({ voteType: arg, userId }),
        },
      );
      if (!res.ok) throw await errorFromResponse(res, "Failed to vote");
      return await res.json();
    },
    {
      onSuccess: () => mutate(`/comments/${nodeId}`),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to vote"),
      throwOnError: false,
    },
  );

  // Edit mutation
  const { trigger: triggerEdit, isMutating: isEditing } = useSWRMutation(
    `/comments/${nodeId}/edit`,
    async (
      _,
      {
        arg,
      }: {
        arg: {
          text: string;
          keepImageIds: number[];
          newImages: File[];
        };
      },
    ) => {
      if (!userId) throw new Error("Not logged in");
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("text", arg.text);
      formData.append("keepImageIds", JSON.stringify(arg.keepImageIds));
      for (const img of arg.newImages) {
        formData.append("images", img);
      }
      const res = await resilientFetch(
        `${API_FORGE_URL}/comments/${comment.id}`,
        {
          method: "PUT",
          body: formData,
        },
      );
      if (!res.ok) throw await errorFromResponse(res, "Failed to edit comment");
      return await res.json();
    },
    {
      onSuccess: () => {
        mutate(`/comments/${nodeId}`);
        setEditing(false);
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to edit comment",
        ),
      throwOnError: false,
    },
  );

  // Report (flag) — signed-in users, one report per user; enough distinct
  // reports auto-hide the comment server-side until a moderator reviews it.
  const { trigger: triggerReport, isMutating: isReporting } = useSWRMutation(
    `/comments/${nodeId}/flags`,
    async () => {
      if (!userId) throw new Error("Sign in to report a comment");
      const res = await resilientFetch(
        `${API_FORGE_URL}/comments/${comment.id}/flags`,
        {
          method: "POST",
          body: JSON.stringify({ userId }),
        },
      );
      if (!res.ok) throw await errorFromResponse(res, "Failed to report");
      return (await res.json()) as { hidden: boolean };
    },
    {
      onSuccess: (result) => {
        setReported(true);
        toast.success(
          result.hidden
            ? "Reported. The comment is hidden until a moderator reviews it."
            : "Reported. Thanks for helping keep comments useful.",
        );
        if (result.hidden) mutate(`/comments/${nodeId}`);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Failed to report"),
      throwOnError: false,
    },
  );

  const handleReportClick = () => {
    if (!confirmReport) {
      setConfirmReport(true);
      clearTimeout(reportTimerRef.current);
      reportTimerRef.current = setTimeout(() => setConfirmReport(false), 3000);
    } else {
      clearTimeout(reportTimerRef.current);
      setConfirmReport(false);
      triggerReport();
    }
  };

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await resilientFetch(
        `${API_FORGE_URL}/comments/${comment.id}`,
        {
          method: "DELETE",
          body: JSON.stringify({ userId }),
        },
      );
      if (!res.ok) {
        throw await errorFromResponse(res, "Failed to delete comment");
      }
      mutate(`/comments/${nodeId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete comment",
      );
    }
  }, [userId, comment.id, nodeId, mutate]);

  const startEdit = () => {
    setEditText(comment.text);
    setEditKeepImageIds(comment.images.map((img) => img.id));
    setEditNewImages([]);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditNewImages([]);
  };

  const submitEdit = () => {
    if (editText.length < 2 || editText.length > 500) return;
    triggerEdit({
      text: editText,
      keepImageIds: editKeepImageIds,
      newImages: editNewImages,
    });
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      clearTimeout(deleteTimerRef.current);
      setConfirmDelete(false);
      handleDelete();
    }
  };

  // Always compute the fallback so it's available if the avatar URL fails to
  // load (e.g. the CDN file was removed but the comment still references it).
  const avatarSVG = useMemo(
    () => toSvg(comment.user_id, 32),
    [comment.user_id],
  );
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [comment.avatar_url]);

  const isEdited =
    comment.updated_at !== comment.created_at &&
    new Date(comment.updated_at).getTime() -
      new Date(comment.created_at).getTime() >
      1000;

  const existingImagesForUpload = useMemo(
    () =>
      comment.images
        .filter((img) => editKeepImageIds.includes(img.id))
        .map((img) => ({ id: img.id, url: img.url })),
    [comment.images, editKeepImageIds],
  );

  return (
    <div className="flex gap-2.5 text-sm">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {comment.avatar_url && !avatarLoadFailed ? (
          <img
            src={comment.avatar_url}
            alt={comment.username}
            className="w-8 h-8 rounded-full object-cover"
            onError={() => setAvatarLoadFailed(true)}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: avatarSVG }}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-medium text-primary text-xs">
            {comment.username}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {relativeTime(comment.created_at)}
          </span>
          {isEdited && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              edited
            </span>
          )}
        </div>

        {/* Body: edit mode or display */}
        {editing ? (
          <div className="mt-1.5 space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              className="text-xs min-h-0 resize-none"
              maxLength={500}
            />
            <CommentImageUpload
              images={editNewImages}
              onImagesChange={setEditNewImages}
              existingImages={existingImagesForUpload}
              onExistingImageRemove={(id) =>
                setEditKeepImageIds((prev) => prev.filter((x) => x !== id))
              }
            />
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={submitEdit}
                disabled={
                  isEditing || editText.length < 2 || editText.length > 500
                }
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={cancelEdit}
                disabled={isEditing}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {editText.length}/500
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Comment text */}
            <div className="mt-0.5 text-xs leading-relaxed [&_p]:m-0 [&_a]:underline [&_a]:text-primary [&_img]:max-w-full [&_img]:rounded [&_img]:my-1">
              <Markdown
                options={{
                  forceBlock: true,
                  overrides: {
                    a: {
                      component: "a",
                      props: { className: "underline", target: "_blank" },
                    },
                    img: {
                      component: "img",
                      props: {
                        className: "max-h-32 rounded",
                      },
                    },
                  },
                }}
              >
                {comment.text.replace(/\n/g, "  \n")}
              </Markdown>
            </div>

            {/* Image thumbnails */}
            {comment.images.length > 0 && (
              <CommentImageGallery images={comment.images} />
            )}

            {/* Action bar */}
            <div className="flex items-center gap-0.5 mt-1 -ml-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => triggerVote("upvote")}
                disabled={isVoting || !userId || isOwner}
              >
                <ThumbsUp className="h-3 w-3" />
                {comment.upvotes > 0 && comment.upvotes}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => triggerVote("downvote")}
                disabled={isVoting || !userId || isOwner}
              >
                <ThumbsDown className="h-3 w-3" />
                {comment.downvotes > 0 && comment.downvotes}
              </Button>
              {!isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    confirmReport
                      ? "h-6 px-1.5 text-xs text-red-400 hover:text-red-300 gap-1 ml-auto"
                      : "h-6 px-1.5 text-xs text-muted-foreground/60 hover:text-red-400 gap-1 ml-auto"
                  }
                  onClick={handleReportClick}
                  disabled={isReporting || !userId || reported}
                  title={
                    !userId
                      ? "Sign in to report"
                      : reported
                        ? "Reported"
                        : "Report comment"
                  }
                  aria-label="Report comment"
                >
                  <Flag className="h-3 w-3" />
                  {confirmReport && "Report?"}
                  {reported && "Reported"}
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground gap-1 ml-auto"
                    onClick={startEdit}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      confirmDelete
                        ? "h-6 px-1.5 text-xs text-red-400 hover:text-red-300 gap-1"
                        : "h-6 px-1.5 text-xs text-muted-foreground hover:text-red-400 gap-1"
                    }
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="h-3 w-3" />
                    {confirmDelete && "Confirm?"}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CommentImageGallery({ images }: { images: CommentImage[] }) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);

  return (
    <>
      <div className="flex gap-1.5 mt-1.5">
        {images.map((img) => (
          <img
            key={img.id}
            src={img.url}
            alt=""
            className="h-16 rounded object-cover border border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setOpenUrl(img.url)}
          />
        ))}
      </div>
      {openUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-10000 flex items-center justify-center bg-black/80 cursor-pointer"
            onClick={() => setOpenUrl(null)}
          >
            <img
              src={openUrl}
              alt=""
              className="max-w-[90vw] max-h-[90vh] object-contain rounded"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
