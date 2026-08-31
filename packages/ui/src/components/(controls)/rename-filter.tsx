import { useT, useUserStore } from "../(providers)";
import { Button, Label } from "../(controls)";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useState } from "react";
import { Input } from "../ui/input";
import { type DrawingsAndNodes, useSettingsStore } from "@repo/lib";

export function RenameFilter({
  myFilter,
  onClose,
}: {
  myFilter: DrawingsAndNodes | null;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const setMyFilter = useSettingsStore((state) => state.setMyFilter);
  const filters = useUserStore((state) => state.filters);
  const setFilters = useUserStore((state) => state.setFilters);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!myFilter) {
      return;
    }
    event.preventDefault();
    const filterName = `my_${Date.now()}_${name}`;
    const wasActive = filters.includes(myFilter.name);
    const newFilters = filters.filter((f) => f !== myFilter.name);
    setMyFilter(myFilter.name, { name: filterName });
    onClose();
    if (wasActive) {
      newFilters.push(filterName);
    }
    setFilters(newFilters);
  };

  return (
    <Dialog
      open={!!myFilter}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t("myFilters.renameDialogTitle", {
              fallback: "Rename {{name}}",
              vars: { name: myFilter?.name.replace(/my_\d+_/, "") ?? "" },
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("myFilters.renameDescription", {
              fallback: "Rename this filter.",
            })}
          </DialogDescription>
        </DialogHeader>
        <section className="space-y-4 overflow-hidden">
          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="name">
                {t("common.name", { fallback: "Name" })}
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder={t("myFilters.renamePlaceholder", {
                  fallback: "Enter new name",
                })}
              />
            </div>
            <Button type="submit" disabled={!name} className="w-full">
              {t("myFilters.renameFilter", { fallback: "Rename Filter" })}
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}
