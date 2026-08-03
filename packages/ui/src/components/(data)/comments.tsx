"use client";

import { Info, MessageCircle } from "lucide-react";
import {
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from "../(controls)";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "../ui/textarea";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { Skeleton } from "../ui/skeleton";
import { API_FORGE_URL, resilientFetch, useAccountStore } from "@repo/lib";
import { type Comment, SingleComment } from "./comment";
import { ScrollArea } from "../ui/scroll-area";
import { AuthAlert } from "./auth-alert";
import {
  CommentImageUpload,
  appendCommentImages,
  prepareCommentImages,
} from "./comment-image-upload";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { errorFromResponse } from "./comment-utils";

const formSchema = z.object({
  text: z.string().min(2).max(500),
});

export function Comments({ id, appName }: { id: string; appName: string }) {
  const userId = useAccountStore((state) => state.userId);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const isThglApp = typeof window !== "undefined" && !!window.chrome?.webview;

  const handleFormPaste = useCallback((e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file" && /^image\//.test(item.type))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (files.length > 0) {
      e.preventDefault();
      // Same pipeline as the dropzone — an unchecked paste used to send
      // oversized images the server rejects with a silent 400. Oversized
      // screenshots get re-encoded to WebP instead of rejected.
      void prepareCommentImages(files).then((prepared) => {
        if (prepared.length > 0) {
          setPendingImages((prev) => appendCommentImages(prev, prepared));
        }
      });
    }
  }, []);

  const {
    data: comments,
    isLoading,
    error,
  } = useSWR(`/comments/${id}`, async () => {
    const res = await resilientFetch(
      `${API_FORGE_URL}/comments?node_id=${id}&app_id=${appName}`,
    );
    if (!res.ok) {
      throw new Error("Failed to fetch comments");
    }
    return ((await res.json()) as { comments: Comment[] }).comments.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  });

  const {
    trigger,
    isMutating,
    error: submitError,
  } = useSWRMutation(
    `/comments/${id}`,
    async (
      _,
      {
        arg,
      }: {
        arg: {
          appId: string;
          nodeId: string;
          text: string;
          userId: string;
          images: File[];
        };
      },
    ) => {
      const formData = new FormData();
      formData.append("appId", arg.appId);
      formData.append("nodeId", arg.nodeId);
      formData.append("text", arg.text);
      formData.append("userId", arg.userId);
      for (const img of arg.images) {
        formData.append("images", img);
      }
      const res = await resilientFetch(`${API_FORGE_URL}/comments`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw await errorFromResponse(res, "Failed to post comment");
      }
      return (await res.json()) as { comment: Comment };
    },
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const watchText = form.watch("text");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) return;

    try {
      await trigger({
        appId: appName,
        nodeId: id,
        text: values.text,
        userId,
        images: pendingImages,
      });
      // Only clear on success — a failed post keeps the draft so the user
      // can retry without retyping.
      form.reset();
      setPendingImages([]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to post comment",
      );
    }
  };

  return (
    <>
      <h3 className="text-sm font-medium flex items-center gap-1.5 uppercase tracking-wide text-muted-foreground">
        <MessageCircle className="w-3.5 h-3.5" />
        Comments
        {comments && comments.length > 0 && (
          <span className="text-xs font-normal">({comments.length})</span>
        )}
      </h3>

      <ScrollArea type="auto" className="grow">
        <div className="py-3 space-y-4">
          {error && <p className="text-xs text-destructive">{error.message}</p>}
          {!error && isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          )}
          {!error && !isLoading && comments?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No comments yet. Be the first!
            </p>
          )}
          {comments?.map((comment) => (
            <SingleComment key={comment.id} comment={comment} nodeId={id} />
          ))}
        </div>
      </ScrollArea>

      {/* Form */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium">Add comment</span>
          <div className="flex items-center gap-1.5">
            <a
              href="https://www.markdownguide.org/cheat-sheet/"
              target="_blank"
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              Markdown
            </a>
            <HoverCard openDelay={20} closeDelay={20}>
              <HoverCardTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent className="text-xs w-auto max-w-[240px]">
                  <p>Comments are public and visible to everyone.</p>
                  <p>
                    Be respectful, avoid spamming and ask before advertisement.
                  </p>
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          </div>
        </div>

        {!userId ? (
          <AuthAlert />
        ) : (
          <Form {...form}>
            <form
              className="space-y-2"
              onSubmit={form.handleSubmit(onSubmit)}
              onPaste={handleFormPaste}
            >
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        className="text-xs min-h-0 resize-none"
                        placeholder="Write a comment..."
                        rows={2}
                        maxLength={500}
                        disabled={isMutating || !userId}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CommentImageUpload
                images={pendingImages}
                onImagesChange={setPendingImages}
                showScreenshot={isThglApp}
              />

              <div className="flex items-center justify-end">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {watchText?.length ?? 0}/500
                </span>
              </div>

              {submitError instanceof Error && !isMutating && (
                <p className="text-xs text-destructive">
                  {submitError.message}
                </p>
              )}

              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs"
                disabled={isMutating || !userId}
              >
                {isMutating ? "Sending..." : "Send"}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </>
  );
}
