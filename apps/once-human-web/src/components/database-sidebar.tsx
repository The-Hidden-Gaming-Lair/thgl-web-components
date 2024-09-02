"use client";
import { Sidebar } from "@repo/ui/data";
import { useT, type Database } from "@repo/ui/providers";
import { useState } from "react";

export function DatabaseSidebar({
  database,
}: {
  database: Database;
}): JSX.Element {
  const t = useT();

  const menu = database
    .sort((a, b) =>
      t(a.type).localeCompare(t(b.type), undefined, { numeric: true }),
    )
    .map((item) => {
      return {
        category: {
          key: item.type,
          value: t(item.type),
        },
        items: item.items
          .sort((a, b) => b.props.sortPriority - a.props.sortPriority)
          .map((subitem) => ({
            key: subitem.id,
            value: (
              <button
                type="button"
                onClick={() => {
                  setActiveItem(subitem);
                }}
              >
                {subitem.props.title}
              </button>
            ),
          })),
      };
    });

  const [activeItem, setActiveItem] = useState<{
    id: string;
    icon?: string;
    props: Record<string, any>;
  }>(database[0].items[0]);

  const activeCategory = database[0].type;

  return (
    <div className="md:flex gap-1">
      <Sidebar
        activeCategory={activeCategory}
        activeItem={activeItem.id}
        menu={menu}
      />
      <div className="py-6 text-left space-y-1">
        <h3 className="uppercase text-4xl">{activeItem.props.title}</h3>
        <p className="text-primary">{activeItem.props.title1}</p>
        <p className="text-primary">{activeItem.props.title2}</p>
        <p className="text-primary">{activeItem.props.title3}</p>
        <p className="pt-8 text-muted-foreground">{activeItem.props.content}</p>
      </div>
    </div>
  );
}
