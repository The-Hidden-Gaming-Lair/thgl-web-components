import { getSuggestionOrIssueDetail, getSuggestionsAndIssues } from "@repo/lib";
import { Subtitle } from "@repo/ui/content";
import { Button } from "@repo/ui/controls";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";

import { SuggestionIssueDetail } from "./suggestions-issues";

export async function generateStaticParams() {
  const posts = await getSuggestionsAndIssues(100);
  return posts.map((post) => ({
    id: post.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getSuggestionOrIssueDetail(id);

  if (!post) {
    return {
      title: "Post Not Found - The Hidden Gaming Lair",
    };
  }

  return {
    title: `${post.name} - Suggestions & Issues - The Hidden Gaming Lair`,
    description: post.content.slice(0, 160),
    alternates: { canonical: `/suggestions-issues/${post.id}` },
    openGraph: {
      url: `/suggestions-issues/${post.id}`,
    },
  };
}

export default async function SuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getSuggestionOrIssueDetail(id);

  if (!post) {
    notFound();
  }

  return (
    <PageShell>
      <section className="space-y-4">
        <Link href="/suggestions-issues">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all suggestions
          </Button>
        </Link>
        <Subtitle title={post.name} />
        <p className="text-sm text-muted-foreground">
          Browse through community suggestions and reported issues from our{" "}
          <a
            href="https://th.gl/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline text-nowrap"
          >
            Discord server
          </a>
          . Join the{" "}
          <a
            href="https://discord.com/channels/320539672663031818/1021543411293106217"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            #suggestions-issues
          </a>{" "}
          channel to contribute your own ideas!
        </p>
      </section>

      <SuggestionIssueDetail post={post} />
    </PageShell>
  );
}
