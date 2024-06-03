import { notFound } from "next/navigation";
import { ContentLayout } from "@repo/ui/ads";
import { DataTable } from "@repo/ui/data";
import { type Dict } from "@repo/ui/providers";
import database from "../../data/database.json" assert { type: "json" };
import _enDict from "../../dicts/en.json" assert { type: "json" };
import { columns } from "./columns";

const enDict = _enDict as Dict;

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

  const data = category.items.map((item) => ({
    icon: item.icon,
    name: enDict[item.id],
    ...item.props,
  }));

  return (
    <ContentLayout
      id="zerospace"
      header={<h2 className="text-2xl">{enDict[category.type]}</h2>}
      content={<DataTable columns={columns} data={data} filterColumn="name" />}
    />
  );
}
