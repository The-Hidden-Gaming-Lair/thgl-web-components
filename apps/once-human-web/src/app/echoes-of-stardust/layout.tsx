import { HeaderOffset } from "@repo/ui/header";
import { ContentLayout } from "@repo/ui/ads";
import { type Database, type Dict } from "@repo/ui/providers";
import Link from "next/link";
import { DatabaseSidebar } from "@/components/database-sidebar";
import database from "../../data/database.json" assert { type: "json" };
import _enDict from "../../dicts/en.json" assert { type: "json" };

const enDict = _enDict as Dict;

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const data = database
    .filter((item) => item.type.startsWith("echoes_of_stardust_"))
    .sort((a, b) =>
      enDict[a.type].localeCompare(enDict[b.type], undefined, {
        numeric: true,
      }),
    ) as Database;

  const menu = data.map((item) => {
    return {
      category: {
        key: item.type,
        value: enDict[item.type],
      },
      items: item.items
        .sort(
          (a, b) =>
            ("sortPriority" in b.props &&
            typeof b.props.sortPriority === "number"
              ? b.props.sortPriority
              : 0) -
            ("sortPriority" in a.props &&
            typeof a.props.sortPriority === "number"
              ? a.props.sortPriority
              : 0),
        )
        .map((subitem) => ({
          key: subitem.id,
          value: (
            <Link
              href={`/echoes-of-stardust/${subitem.id}`}
              title={subitem.props.title}
            >
              {subitem.props.title}
            </Link>
          ),
        })),
    };
  });

  return (
    <HeaderOffset full>
      <ContentLayout
        id="once-human"
        header={
          <>
            <h2 className="text-2xl">All Echoes Of Stardust</h2>
            <p className="text-sm my-2">
              A comprehensive list of Echoes Of Stardust for Once Human.
            </p>
          </>
        }
        sidebar={<DatabaseSidebar menu={menu} />}
        content={children}
      />
    </HeaderOffset>
  );
}
