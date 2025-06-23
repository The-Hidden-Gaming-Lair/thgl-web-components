import { HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { notFound } from "next/navigation";
import { fetchDatabase, fetchDict } from "@repo/lib";
import { type Database } from "@repo/ui/providers";
import { APP_CONFIG } from "@/config";
import { DataTableColumns } from "./columns";

export const metadata: Metadata = {
  alternates: {
    canonical: "/weapons",
  },
  title: "All Weapons – The Hidden Gaming Lair",
  description: "A comprehensive list of weapons for Once Human.",
};

export default async function Weapons() {
  const database = await fetchDatabase(APP_CONFIG.name);
  const enDict = await fetchDict(APP_CONFIG.name);

  const category = database.find(
    (item) => item.type === `weapon`,
  ) as Database[number];
  if (!category) {
    notFound();
  }
  const data = category.items
    .map((item) => ({
      icon: item.icon!,
      name: item.props.name as string,
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
          <DataTableColumns data={data} database={database} enDict={enDict} />
        }
      />
    </HeaderOffset>
  );
}
