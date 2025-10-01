"use client";

import { Button } from "../ui/button";
import {
  ArrowDown,
  ArrowUp,
  Compass,
  Box,
  LocateFixed,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Square,
  Wand2,
} from "lucide-react";

export function MapControls(): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/90 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Player</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            aria-label="Center map on player"
            className="justify-start gap-2"
          >
            <LocateFixed className="h-4 w-4" />
            <span className="text-xs">Center</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            aria-label="Simulate player location"
            className="justify-start gap-2"
          >
            <Wand2 className="h-4 w-4" />
            <span className="text-xs">Simulate</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">View</span>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            aria-label="Switch to 2D view"
            className="justify-center gap-2"
          >
            <Square className="h-4 w-4" />
            <span className="text-xs">2D</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            aria-label="Switch to 3D view"
            className="justify-center gap-2"
          >
            <Box className="h-4 w-4" />
            <span className="text-xs">3D</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Compass</span>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Rotate left"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            type="button"
            aria-label="Reset heading"
          >
            <Compass className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Rotate right"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Tilt up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-[10px] font-semibold uppercase text-muted-foreground">
            Tilt
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Tilt down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase text-muted-foreground">Zoom</span>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            size="icon"
            type="button"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
