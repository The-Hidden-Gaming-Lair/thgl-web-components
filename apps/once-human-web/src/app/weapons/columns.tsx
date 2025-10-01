"use client";
import { ArrowUpDown, Button } from "@repo/ui/controls";
import Image from "next/image";
import { DataTable, type ColumnDef } from "@repo/ui/data";
import { Dict, getIconsUrl, type DatabaseConfig } from "@repo/lib";
import { APP_CONFIG } from "@/config";

export interface Item {
  icon: string;
  [key: string]: string | number | any;
}

export function DataTableColumns({
  database,
  enDict,
  data,
}: {
  database: DatabaseConfig;
  enDict: Dict;
  data: Item[];
}) {
  const columns = createColumns(database, enDict);
  return <DataTable columns={columns} data={data} filterColumn="name" />;
}
function createColumns(database: DatabaseConfig, enDict: Dict) {
  const props = Object.keys(database[0].items[0].props).filter(
    (prop) => prop !== "weapons" && prop !== "abilities",
  );

  const propsColumns: ColumnDef<Item>[] = props.map((prop) => ({
    accessorKey: prop,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          {enDict[prop]}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  }));

  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: "icon",
      header: "",
      cell: ({ row }) => {
        const icon = row.getValue<string>("icon");
        return (
          <Image
            src={getIconsUrl(APP_CONFIG.name, icon)}
            width="169"
            height="50"
            alt=""
            className="h-[50px] w-[169px] max-w-fit"
          />
        );
      },
    },
    ...propsColumns,
  ];
  return columns;
}
