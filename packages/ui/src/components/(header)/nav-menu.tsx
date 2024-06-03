"use client";
import { ReactNode, useEffect, useState } from "react";
import { Button } from "../(controls)";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { cn } from "@repo/lib";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [active]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          asChild
          className={cn("ml-auto", {
            "lg:hidden": breakpoint === "lg",
            "md:hidden": breakpoint === "md",
            "sm:hidden": breakpoint === "sm",
          })}
        >
          <Button variant="outline" size="sm" className="px-1">
            {active}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col items-center gap-2">
            {children}
            <Separator />
            {external}
          </div>
        </PopoverContent>
      </Popover>
      <div
        className={cn("hidden w-full items-center gap-2", {
          "lg:flex": breakpoint === "lg",
          "md:flex": breakpoint === "md",
          "sm:flex": breakpoint === "sm",
        })}
      >
        {children}
        <div className="grow" />
        {external}
      </div>
    </>
  );
}
