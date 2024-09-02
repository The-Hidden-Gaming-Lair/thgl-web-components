"use client";
import { Sidebar } from "@repo/ui/data";
import { useParams } from "next/navigation";

export function DatabaseSidebar({
  menu,
}: {
  menu: {
    category: {
      key: string;
      value: JSX.Element | string;
    };
    items: {
      key: string;
      value: JSX.Element;
    }[];
  }[];
}): JSX.Element {
  const params = useParams<{ id?: string }>();

  if (!params.id) {
    return (
      <Sidebar
        activeCategory={menu[0].category.key}
        activeItem={menu[0].items[0].key}
        menu={menu}
      />
    );
  }
  const category = menu.find((item) =>
    item.items.some((i) => i.key === params.id),
  );
  if (!category) {
    return <Sidebar menu={menu} />;
  }

  const item = category.items.find((i) => i.key === params.id);
  if (!item) {
    return <Sidebar activeCategory={category.category.key} menu={menu} />;
  }

  return (
    <Sidebar
      activeCategory={category.category.key}
      activeItem={item.key}
      menu={menu}
    />
  );
}
