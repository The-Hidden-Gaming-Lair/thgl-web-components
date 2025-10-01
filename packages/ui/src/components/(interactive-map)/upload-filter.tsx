import {
  type DrawingsAndNodes,
  openFileOrFiles,
  useSettingsStore,
  useUserStore,
} from "@repo/lib";
import { Button } from "../(controls)";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export function UploadFilter() {
  const addMyFilter = useSettingsStore((state) => state.addMyFilter);
  const mapName = useUserStore((state) => state.mapName);
  const toggleFilter = useUserStore((state) => state.toggleFilter);

  return (
    <Button
      size="sm"
      type="button"
      variant="secondary"
      onClick={async () => {
        const file = await openFileOrFiles();
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", (loadEvent) => {
          const text = loadEvent.target?.result;
          if (!text || typeof text !== "string") {
            return;
          }
          try {
            const data = JSON.parse(text);
            if (typeof data !== "object") {
              return;
            }
            let myFilter: DrawingsAndNodes;
            if (!Array.isArray(data)) {
              if (data.id && !data.filter) {
                // Deprecated Drawing
                if ("positions" in data && Array.isArray(data.positions)) {
                  // Convert deprecate routes to polylines
                  data.polylines = data.positions.map((b: any) => ({
                    positions: b.map((c: any) => c.position),
                    size: 4,
                    color: "#FFFFFFAA",
                    mapName: mapName,
                  }));
                  delete data.positions;
                }
                if ("types" in data) {
                  delete data.types;
                }
                myFilter = {
                  name: `my_${Date.now()}_${data.name}`,
                  drawing: data,
                };
                if ("name" in data) {
                  delete data.name;
                }
              } else {
                myFilter = data;
                myFilter.name = myFilter.name.replace(
                  /my_\d+_/,
                  `my_${Date.now()}_`,
                );
              }
            } else if (data[0]?.id) {
              const filter = data[0]?.filter ?? "Unsorted";
              // Deprecated Node
              myFilter = {
                name: `my_${Date.now()}_${filter.replace("private_", "").replace(/shared_\d+_/, "")}`,
                nodes: data,
              };
              data.forEach((d: any) => {
                if ("filter" in d) {
                  delete d.filter;
                }
              });
            } else {
              throw new Error("Invalid filter");
            }

            addMyFilter(myFilter);
            toggleFilter(myFilter.name);
            toast(
              `Imported filter: ${myFilter.name
                .replace("private_", "")
                .replace(/shared_\d+_/, "")}`,
            );
          } catch (error) {
            console.error(error);
            toast.error("Invalid filter");
            // Do nothing
          }
        });
        reader.readAsText(file);
      }}
    >
      <Upload className="h-4 w-4 mr-2" />
      Upload
    </Button>
  );
}
