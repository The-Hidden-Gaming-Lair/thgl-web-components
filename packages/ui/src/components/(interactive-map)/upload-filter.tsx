import {
  type DrawingsAndNodes,
  openFileOrFiles,
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
        const data = JSON.parse(text);
        if (typeof data !== "object") return;
        let myFilter: DrawingsAndNodes;
        if (!Array.isArray(data)) {
          if (data.id && !data.filter) {
            // Deprecated drawing format
            if ("positions" in data && Array.isArray(data.positions)) {
              data.polylines = data.positions.map((b: any) => ({
                positions: b.map((c: any) => c.position),
                size: 4,
                color: "#FFFFFFAA",
                mapName,
              }));
              delete data.positions;
            }
            if ("types" in data) delete data.types;
            myFilter = {
              name: `my_${Date.now()}_${data.name}`,
              drawing: data,
            };
            if ("name" in data) delete data.name;
          } else {
            myFilter = data;
            myFilter.name = myFilter.name.replace(
              /my_\d+_/,
              `my_${Date.now()}_`,
            );
          }
        } else if (data[0]?.id) {
          const filter = data[0]?.filter ?? "Unsorted";
          myFilter = {
            name: `my_${Date.now()}_${filter.replace("private_", "").replace(/shared_\d+_/, "")}`,
            nodes: data,
          };
          data.forEach((d: any) => {
            if ("filter" in d) delete d.filter;
          });
        } else {
          throw new Error("Invalid filter");
        }

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
