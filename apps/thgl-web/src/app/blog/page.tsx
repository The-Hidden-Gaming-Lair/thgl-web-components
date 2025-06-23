import Link from "next/link";
import { blogEntries } from "@/lib/blog-entries";
import { Subtitle } from "@/components/subtitle";

export const metadata = {
  title: "Blog – The Hidden Gaming Lair",
  description:
    "Updates, game guides, new feature announcements, and development insights from TH.GL",
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
  const entries = [...blogEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <section className="max-w-3xl mx-auto px-4 pt-10 pb-20 space-y-10">
      <div className="text-center space-y-4">
        <Subtitle>Blog & Updates</Subtitle>
        <p className="text-muted-foreground">
          Announcements, behind-the-scenes, guides, and more from The Hidden
          Gaming Lair.
        </p>
      </div>

      <ul className="space-y-6">
        {entries.map((entry) => (
          <li key={entry.id} className="space-y-1">
            <Link
              href={`/blog/${entry.id}`}
              className="text-lg font-semibold hover:underline"
            >
              {entry.title}
            </Link>
            <p className="text-sm text-muted-foreground">{entry.description}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(entry.date).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
