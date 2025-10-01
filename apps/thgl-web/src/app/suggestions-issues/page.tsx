import { getSuggestionsAndIssues } from "@repo/lib";
import { Subtitle } from "@repo/ui/content";
import type { Metadata } from "next";
import { SuggestionsIssuesList } from "./[id]/suggestions-issues";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Suggestions & Issues - The Hidden Gaming Lair",
  description:
    "View and discuss suggestions and reported issues for The Hidden Gaming Lair projects.",
  alternates: { canonical: "/suggestions-issues" },
  openGraph: {
    url: `/suggestions-issues`,
  },
};

export default async function SuggestionsPage() {
  const posts = await getSuggestionsAndIssues(50);

  return (
    <PageShell>
      <section className="space-y-4">
        <Subtitle title="Suggestions & Issues" />
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

      <div className="space-y-6">
        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No suggestions or issues found. Check back later!
          </p>
        ) : (
          <SuggestionsIssuesList posts={posts} initialLimit={10} />
        )}
      </div>
    </PageShell>
  );
}
