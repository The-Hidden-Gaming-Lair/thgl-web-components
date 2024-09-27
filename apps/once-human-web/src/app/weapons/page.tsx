import { HeaderOffset } from "@repo/ui/header";
import { DataTable } from "@repo/ui/data";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { notFound } from "next/navigation";
import { type Database } from "@repo/ui/providers";
import database from "../../data/database.json" assert { type: "json" };
import { columns } from "./columns";

export const metadata: Metadata = {
  alternates: {
    canonical: "/weapons",
  },
  title: "All Weapons – The Hidden Gaming Lair",
  description: "A comprehensive list of weapons for Once Human.",
};

export default function Weapons(): JSX.Element {
  const category = database.find(
    (item) => item.type === `weapon`,
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const data = category.items
    .map((item) => ({
      icon: item.icon,
      ...item.props,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <HeaderOffset full>
      <ContentLayout
        id="once-human"
        header={
          <>
            <h2 className="text-2xl">All Weapons</h2>
            <p className="text-sm">
              A comprehensive list of weapons for Once Human.
            </p>
          </>
        }
        content={
          <DataTable columns={columns} data={data} filterColumn="name" />
        }
      />
    </HeaderOffset>
  );
}
