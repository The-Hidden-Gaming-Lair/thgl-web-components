"use client";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "../(controls)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { cn } from "@repo/lib";
import { ChevronsUpDown } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";

export function NavMenu({
  children,
  active,
  external,
  breakpoint = "lg",
}: {
  children: ReactNode;
  active: ReactNode;
  external: ReactNode;
  breakpoint?: "lg" | "md" | "sm";
}) {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);

  useEffect(() => {
    if (open1) {
      setOpen1(false);
    }
    if (open2) {
      setOpen2(false);
    }
  }, [active]);

  return (
    <>
      <Popover open={open1} onOpenChange={setOpen1} modal>
        <PopoverTrigger
          asChild
          className={cn("ml-2 mr-auto", {
            "lg:hidden": breakpoint === "lg",
            "md:hidden": breakpoint === "md",
            "sm:hidden": breakpoint === "sm",
          })}
        >
          <Button variant="secondary" size="sm" className="px-1">
            {active}
            <ChevronsUpDown className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <ScrollArea
            className="flex flex-col items-center gap-2 max-h-[75vh]"
            type="auto"
          >
            {children}
            <Separator />
            <div className="flex flex-col items-center gap-2 p-2">
              {external}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <div
        className={cn("hidden w-full items-center gap-2", {
          "lg:flex": breakpoint === "lg",
          "md:flex": breakpoint === "md",
          "sm:flex": breakpoint === "sm",
        })}
      >
        <Popover open={open2} onOpenChange={setOpen2}>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="sm" className="px-1 ml-2">
              {active}
              <ChevronsUpDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <ScrollArea
              className="flex flex-col items-center gap-2 max-h-[75vh]"
              type="auto"
            >
              {children}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <div className="grow" />
        {external}
      </div>
    </>
  );
}
