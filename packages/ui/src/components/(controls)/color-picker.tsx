import { cn } from "@repo/lib";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Paintbrush } from "lucide-react";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";

const SOLIDS = [
  "#FFFFFF", // White
  "#E2E2E2", // Light Gray
  "#222222", // Dark Gray
  "#000000", // Black
  "#ff75c3", // Pink
  "#ffa647", // Orange
  "#ffe83f", // Yellow
  "#9fff5b", // Lime
  "#70e2ff", // Light Blue
  "#cd93ff", // Lilac
  "#09203f", // Dark Blue
  "#ff6f61", // Red
  "#a4ffeb", // Mint
  "#00a6fb", // Azure
  "#ffb347", // Peach
  "#b19cd9", // Lavender
  "#7fdbda", // Aquamarine
  "#fd79a8", // Salmon
  "#6c5ce7", // Purple
  "#55efc4", // Turquoise
  "#fab1a0", // Coral
  "#81ecec", // Light Cyan
  "#ff7675", // Coral Red
  "#ffeaa7", // Cream
  "#c5efc4", // Medium Aquamarine
  "#ff6b81", // Melon
  "#a29bfe", // Wild Blue Yonder
  "#fffa65", // Canary Yellow
  "#00b894", // Green Blue Crayola
  "#ff0000", // Pure Red
  "#00ff00", // Pure Green
  "#0000ff", // Pure Blue
];

export function ColorPicker({
  id,
  value,
  onChange,
  className,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  let color = value.slice(0, 7);
  if (color.length !== 7) {
    color = "#ffffff";
  }
  const opacityHex = value.slice(7, 9);
  let opacity = 255;
  try {
    opacity = parseInt(opacityHex, 16);
    if (isNaN(opacity)) {
      opacity = 255;
    }
  } catch (e) {
    //
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <div className="w-full flex items-center gap-2">
            {value ? (
              <div
                className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
                style={{ background: value }}
              ></div>
            ) : (
              <Paintbrush className="h-4 w-4" />
            )}
            <div className="truncate flex-1">
              {value ? value : "Pick a color"}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="opacity">Opacity</Label>
          <Slider
            id="opacity"
            value={[opacity]}
            onValueChange={(values) => {
              onChange(color + values[0].toString(16).padStart(2, "0"));
            }}
            min={0}
            max={255}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {SOLIDS.map((s) => (
            <button
              key={s}
              style={{ background: s + opacityHex }}
              className="rounded-full h-6 w-6 active:scale-105 border"
              onClick={() => onChange(s + opacityHex)}
              type="button"
            />
          ))}
        </div>

        <Input
          id={id}
          value={value}
          className="col-span-2 h-8"
          onChange={(e) => onChange(e.currentTarget.value)}
        />

        <Button
          size="sm"
          onClick={() => onChange("")}
          className="block mx-auto"
          variant="outline"
          type="button"
        >
          Clear color
        </Button>
      </PopoverContent>
    </Popover>
  );
}
