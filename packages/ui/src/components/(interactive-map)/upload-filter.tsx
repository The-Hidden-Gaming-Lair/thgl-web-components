import {
  openFileOrFiles,
  parseImportedFilter,
  useSettingsStore,
} from "@repo/lib";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useT } from "../(providers)";

export function UploadFilter({
  mapName = "",
  onUploaded,
  compact = false,
}: {
  mapName?: string;
  onUploaded?: (filterName: string) => void;
  /** Tight icon+label sidebar variant. */
  compact?: boolean;
} = {}) {
  const t = useT();
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);

  const handleClick = async () => {
    const file = await openFileOrFiles();
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", (loadEvent) => {
      const text = loadEvent.target?.result;
      if (!text || typeof text !== "string") return;
      try {
        // Shape detection + legacy conversion live in the lib so they can be
        // unit-tested: a modern filter export (which carries a server `id`
        // once synced) used to be mistaken for the legacy bare-drawing format
        // and imported with all of its nodes dropped.
        const myFilter = parseImportedFilter(JSON.parse(text), mapName);

        addMyFilter(myFilter);
        onUploaded?.(myFilter.name);
        toast(
          t("sharedFilter.importedFilter", {
            fallback: "Imported filter: {{name}}",
            vars: {
              name: myFilter.name
                .replace("private_", "")
                .replace(/shared_\d+_/, ""),
            },
          }),
        );
      } catch (error) {
        console.error(error);
        toast.error(t("sharedFilter.invalid", { fallback: "Invalid filter" }));
      }
    });
    reader.readAsText(file);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={t("sharedFilter.uploadFromFile", {
          fallback: "Upload filter from file",
        })}
        aria-label={t("sharedFilter.uploadFromFile", {
          fallback: "Upload filter from file",
        })}
        className="flex h-6 w-6 items-center justify-center text-muted-foreground hover:text-primary transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <Button size="sm" type="button" variant="secondary" onClick={handleClick}>
      <Upload className="h-4 w-4 mr-2" />
      {t("sharedFilter.importFilter", { fallback: "Import Filter" })}
    </Button>
  );
}
