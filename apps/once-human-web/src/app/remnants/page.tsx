import { HeaderOffset } from "@repo/ui/header";
import { type Metadata } from "next";
import { ContentLayout } from "@repo/ui/ads";
import { DatabaseSidebar } from "@/components/database-sidebar";
import database from "../../data/database.json" assert { type: "json" };

export const metadata: Metadata = {
  alternates: {
    canonical: "/remenants",
  },
  title: "All Remenants Field Guide Entries – The Hidden Gaming Lair",
  description:
    "A comprehensive list of remenants records for Once Human. It details the names, titles, authors and more details.",
};

export default function Remnants(): JSX.Element {
  return (
    <HeaderOffset full>
      <ContentLayout
        id="once-human"
        header={
          <>
            <h2 className="text-2xl">All Remenants Records</h2>
            <p className="text-sm">
              A comprehensive list of remenants records for Once Human.
            </p>
          </>
        }
        content={<DatabaseSidebar database={database} />}
      />
    </HeaderOffset>
  );
}
