import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type Database } from "@repo/ui/providers";
import database from "../../data/database.json" assert { type: "json" };

export const metadata: Metadata = {
  alternates: {
    canonical: "/remnants",
  },
  title: "All Remnants Field Guide Entries – The Hidden Gaming Lair",
  description:
    "A comprehensive list of remnants records for Once Human. It details the names, titles, authors and more details.",
};

export default function Remnants(): JSX.Element {
  const category = database.find((item) =>
    item.type.startsWith("remnants_"),
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const item = category.items[0];
  if (!item) {
    notFound();
  }

  return (
    <div className="py-6 text-left space-y-1">
      <h3 className="uppercase text-4xl">{item.props.title}</h3>
      <p className="text-primary">{item.props.title1}</p>
      <p className="text-primary">{item.props.title2}</p>
      <p className="text-primary">{item.props.title3}</p>
      <p className="pt-8 text-muted-foreground whitespace-break-spaces">
        {item.props.content}
      </p>
    </div>
  );
}
