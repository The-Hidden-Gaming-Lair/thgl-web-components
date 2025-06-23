import { notFound } from "next/navigation";
import { blogEntries } from "@/lib/blog-entries";
import { Subtitle } from "@/components/subtitle";
import Link from "next/link";
import { DiscordMessage } from "@repo/ui/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = blogEntries.find((e) => e.id === id);
  if (!entry) return {};
  return {
    title: `${entry.title} | Blog – TH.GL`,
    description: entry.description,
    alternates: { canonical: `/blog/${entry.id}` },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const entry = blogEntries.find((e) => e.id === id);
  if (!entry) return notFound();

  return (
    <section className="space-y-10 px-4 pt-10 pb-20 max-w-2xl mx-auto">
      <Subtitle>{entry.title}</Subtitle>
      <p className="text-sm text-muted-foreground">
        Published on {new Date(entry.date).toLocaleDateString()}
      </p>

      <div className="text-muted-foreground text-base space-y-4">
        <DiscordMessage>{entry.content}</DiscordMessage>
      </div>
      <div>
        <Link
          href="/blog"
          className="text-sm text-brand underline hover:text-white"
        >
          ← Back to Blog
        </Link>
      </div>
    </section>
  );
}
