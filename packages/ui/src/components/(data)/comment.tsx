"use client";

import { ThumbsDown, ThumbsUp, Trash } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Button,
} from "../(controls)";
import { API_FORGE_URL, TH_GL_URL, useAccountStore } from "@repo/lib";
import { toSvg } from "jdenticon";
import { useMemo } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import Markdown from "markdown-to-jsx";

export type Comment = {
  id: number;
  app_id: string;
  node_id: string;
  text: string;
  username: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  upvotes: number;
  downvotes: number;
};

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

  const { trigger, isMutating } = useSWRMutation(
    `/comments/${nodeId}/votes`,
    async (_, { arg }: { arg: "upvote" | "downvote" }) => {
      if (!userId) {
        throw new Error("User not logged in");
      }

      const res = await fetch(`${API_FORGE_URL}/comments/${comment.id}/votes`, {
        method: "PUT",
        body: JSON.stringify({ voteType: arg, userId: userId }),
      });
      if (!res.ok) {
        throw new Error("Failed to vote on comment");
      }
      return await res.json();
    },
    { onSuccess: () => mutate(`/comments/${nodeId}`) },
  );
  const avatarSVG = useMemo(
    () => toSvg(decryptedUserId, 40),
    [decryptedUserId],
  );

  const handleDelete = async () => {
    if (!userId) {
      return;
    }

    await fetch(API_FORGE_URL + `/comments/${comment.id}`, {
      method: "DELETE",
      body: JSON.stringify({ userId: userId }),
    });
    mutate(`/comments/${nodeId}`);
  };

  return (
    <HoverCard openDelay={20} closeDelay={20}>
      <HoverCardTrigger asChild>
        <div className="flex text-sm">
          <div dangerouslySetInnerHTML={{ __html: avatarSVG }} />
          <div className="ml-2">
            <span className="text-primary">{comment.username}</span>
            <small className="ml-1 text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleString()}
            </small>
            <div className="whitespace-pre">
              <Markdown
                options={{
                  forceBlock: true,
                  overrides: {
                    a: {
                      component: "a",
                      props: {
                        className: "underline",
                        target: "_blank",
                      },
                    },
                    img: {
                      component: "img",
                      props: {
                        className: "cursor-pointer",
                        onClick: (e: React.MouseEvent<HTMLImageElement>) => {
                          if (
                            "src" in e.target &&
                            typeof e.target.src === "string"
                          ) {
                            window.open(e.target.src, "_blank");
                          }
                        },
                      },
                    },
                  },
                }}
              >
                {comment.text}
              </Markdown>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-sm text-gray-400 flex items-center">
                {comment.upvotes} <ThumbsUp className="ml-1 w-4 h-4" />
              </span>
              <span className="text-sm text-gray-400 ml-1 flex items-center">
                {comment.downvotes} <ThumbsDown className="ml-1 w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      {userId && (
        <HoverCardContent
          side="top"
          sideOffset={-20}
          align="end"
          className="p-0 w-fit flex items-center"
        >
          {decryptedUserId === comment.user_id ? (
            <>
              <Button size="icon" variant="ghost" onClick={handleDelete}>
                <Trash className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => trigger("upvote")}
                disabled={isMutating}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => trigger("downvote")}
                disabled={isMutating}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </>
          )}
        </HoverCardContent>
      )}
    </HoverCard>
  );
}
