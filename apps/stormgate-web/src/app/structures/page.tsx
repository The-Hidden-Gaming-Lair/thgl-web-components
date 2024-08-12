import { ContentLayout } from "@repo/ui/ads";
import { DataTable } from "@repo/ui/data";
import { type Dict } from "@repo/ui/providers";
import { type Metadata } from "next";
import { HeaderOffset } from "@repo/ui/header";
import { notFound } from "next/navigation";
import database from "../../data/database.json" assert { type: "json" };
import _enDict from "../../dicts/en.json" assert { type: "json" };
import { columns } from "./columns";
import ModeSelect from "@/components/mode-select";

const enDict = _enDict as Dict;

export const metadata: Metadata = {
  alternates: {
    canonical: "/structures",
  },
  title: "Stormgate Structures – The Hidden Gaming Lair",
  description:
    "Find details about all Stormgate structures and buildings for Celestial, Infernal and Vanguard! Check the luminite, therium and supply costs and more stats.",
};

export default function Item({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): JSX.Element {
  const mode = (searchParams.mode as string) || "1v1";
  const category = database.find((item) => item.type === `${mode}_structures`);
  if (!category) {
    notFound();
  }

  const data = category.items
    .map((item) => ({
      icon: item.icon,
      groupId: item.groupId,
      name: enDict[item.id],
      ...item.props,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <HeaderOffset full>
      <ContentLayout
        id="stormgate"
        header={
          <>
            <h2 className="text-2xl">Structures</h2>
            <p className="text-sm">
              Find details about all Stormgate structures for Celestial,
              Infernal and Vanguard! Check the luminite, therium and supply
              costs and more stats.
            </p>
          </>
        }
        content={
          <>
            <ModeSelect mode={mode} />
            <DataTable columns={columns} data={data} filterColumn="name" />
          </>
        }
      />
    </HeaderOffset>
  );
}
