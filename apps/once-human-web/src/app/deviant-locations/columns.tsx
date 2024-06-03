"use client";

import { ArrowUpDown, Button } from "@repo/ui/controls";
import { type ColumnDef } from "@repo/ui/data";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Item {
  deviantName: string;
  location: string;
  type: string;
  likes: string;
}

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "deviantName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Deviant Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => {
            column.toggleSorting(column.getIsSorted() === "asc");
          }}
        >
          Type/Effect
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "likes",
    header: "Likes",
  },
];
