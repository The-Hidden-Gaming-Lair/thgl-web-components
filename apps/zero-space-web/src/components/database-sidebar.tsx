"use client";
import { Sidebar } from "@repo/ui/data";
import { useParams } from "next/navigation";

export function DatabaseSidebar({
  menu,
}: {
  menu: {
    category: {
      key: string;
      value: JSX.Element;
    };
    items: {
      key: string;
      value: JSX.Element;
    }[];
  }[];
}): JSX.Element {
  const params = useParams<{ type?: string; id?: string }>();
  const category = menu.find((item) => item.category.key === params.type);
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
