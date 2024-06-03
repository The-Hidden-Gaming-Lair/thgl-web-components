import { Details } from "@repo/ui/data";
import { notFound } from "next/navigation";
import database from "../../../data/database.json" assert { type: "json" };

export const metadata = {
  title: "Zero Space",
};

export default function Item({
  params,
}: {
  params: {
    type: string;
    id: string;
  };
}): JSX.Element {
  const category = database.find((item) => item.type === params.type);
  if (!category) {
    notFound();
  }
  const item = category.items.find((i) => i.id === params.id);
  if (!item) {
    notFound();
  }

  return <Details type={category.type} {...item} />;
}
