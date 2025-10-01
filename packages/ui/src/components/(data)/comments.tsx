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
import { API_FORGE_URL, useAccountStore } from "@repo/lib";
import { Comment, SingleComment } from "./comment";
import { ScrollArea } from "../ui/scroll-area";
import { AuthAlert } from "./auth-alert";

const formSchema = z.object({
  text: z.string().min(2).max(50),
});

export function Comments({ id, appName }: { id: string; appName: string }) {
  const userId = useAccountStore((state) => state.userId);
  const commentsPerk = useAccountStore((state) => state.perks.comments);

  const {
    data: comments,
    isLoading,
    error,
  } = useSWR(`/comments/${id}`, async () => {
    const res = await fetch(
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
  const { trigger, isMutating } = useSWRMutation(
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
        };
      },
    ) => {
      const res = await fetch(`${API_FORGE_URL}/comments`, {
        method: "POST",
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        throw new Error("Failed to post comment");
      }
      return (await res.json()) as Comment[];
    },
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      return;
    }

    await trigger({
      appId: appName,
      nodeId: id,
      text: values.text,
      userId: userId,
    });
    form.reset();
  };

  return (
    <>
      <h4 className="text-md flex items-center uppercase">
        <MessageCircle className="w-4 h-4 mr-2" />
        Comments
      </h4>
      <ScrollArea type="auto" className="grow">
        <section className="my-4 space-y-4">
          {error && <p className="text-red-500">{error.message}</p>}
          {!error && isLoading && <Skeleton className="h-6" />}
          {comments?.length === 0 && <p>No comments yet</p>}
          {comments?.map((comment) => (
            <SingleComment key={comment.id} comment={comment} nodeId={id} />
          ))}
        </section>
      </ScrollArea>
      <div>
        <h4 className="flex items-center justify-between">
          <span className="font-bold">
            <span className="hidden md:inline">Add </span>Comment
          </span>
          <span className="ml-2 text-muted-foreground text-xs grow">
            <a
              href="https://www.markdownguide.org/cheat-sheet/"
              target="_blank"
              rel="noreferrer"
              className="text-primary"
            >
              Markdown
            </a>
            <span className="hidden md:inline"> is supported</span>
          </span>
          <HoverCard openDelay={20} closeDelay={20}>
            <HoverCardTrigger>
              <Info className="h-4 w-4" />
            </HoverCardTrigger>
            <HoverCardPortal>
              <HoverCardContent className="text-sm w-auto">
                <p>Comments are public and will be visible to everyone.</p>
                <p>
                  Be respektful, avoid spamming and ask before advertisement.
                </p>
              </HoverCardContent>
            </HoverCardPortal>
          </HoverCard>
        </h4>
      </div>
      {!commentsPerk ? (
        <AuthAlert />
      ) : (
        <Form {...form}>
          <form className="space-y-2" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      className="overflow-hidden"
                      placeholder="Comment"
                      rows={1}
                      disabled={isMutating || !userId}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isMutating || !userId}>
              Send
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
