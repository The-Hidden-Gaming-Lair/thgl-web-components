"use client";

import { ArrowUpDown, Button } from "@repo/ui/controls";
import { Ping } from "@repo/ui/data";
import { type ColumnDef } from "@repo/ui/data";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Item {
  url: string;
  region: string;
}

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "region",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Region
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const region = row.getValue<string>("region");
      return region.replaceAll("_", " ");
    },
  },
  {
    accessorKey: "url",
    header: "Ping",
    cell: ({ row }) => {
      const url = row.getValue<string>("url");
      return <Ping url={url} />;
    },
  },
];
