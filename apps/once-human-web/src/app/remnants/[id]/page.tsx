import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { type Database } from "@repo/ui/providers";
import database from "../../../data/database.json" assert { type: "json" };

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const category = database.find((item) =>
    item.items.some((i) => i.id === id),
  ) as Database[number];
  if (!category) {
    return {};
  }
  const item = category.items.find((i) => i.id === id);
  if (!item) {
    return {};
  }

  return {
    title: `${item.props.title} – The Hidden Gaming Lair`,
    description: item.props.content,
  };
}

export default async function Item({
  params,
}: {
  params: Params;
}): Promise<JSX.Element> {
  const { id } = await params;
  const category = database.find((item) =>
    item.items.some((i) => i.id === id),
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const item = category.items.find((i) => i.id === id);
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
