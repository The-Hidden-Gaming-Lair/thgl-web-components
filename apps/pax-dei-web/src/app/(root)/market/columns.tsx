"use client";

import { ArrowUpDown, Button } from "@repo/ui/controls";
import { type ColumnDef } from "@repo/ui/data";
import Markdown from "markdown-to-jsx";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Item {
  name: string;
  description: string;
}

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue<string>("description");
      return <Markdown options={{ forceBlock: false }}>{description}</Markdown>;
    },
  },
];
