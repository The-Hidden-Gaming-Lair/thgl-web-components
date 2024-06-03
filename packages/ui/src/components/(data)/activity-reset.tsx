"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useActivitiesStore } from "../(providers)";
import { Button } from "../(controls)";

export function ActivityReset() {
  const [open, setOpen] = useState(false);

  const activitiesStore = useActivitiesStore();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex gap-2">
          <span>Reset Progress</span>
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-52" onClick={() => setOpen(false)}>
        <Button
          disabled={Object.keys(activitiesStore.progress).length === 0}
          className="w-full hover:bg-destructive"
          variant="ghost"
          onClick={() => activitiesStore.resetProgress("daily")}
        >
          Reset <span className="text-green-500 mx-1">Daily</span> Progress
        </Button>
        <Button
          disabled={Object.keys(activitiesStore.progress).length === 0}
          className="w-full hover:bg-destructive"
          variant="ghost"
          onClick={() => activitiesStore.resetProgress("weekly")}
        >
          Reset <span className="text-yellow-500 mx-1">Weekly</span> Progress
        </Button>
        <Button
          variant="ghost"
          className="w-full hover:bg-destructive"
          onClick={() => {
            if (
              confirm(
                "Are you sure that you want to restore the default activities?"
              )
            ) {
              activitiesStore.restoreDefaultActivities();
            }
          }}
        >
          Restore activities
        </Button>
      </PopoverContent>
    </Popover>
  );
}
