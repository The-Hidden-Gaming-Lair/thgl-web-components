"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { cn, useSettingsStore } from "@repo/lib";
import { useOverwolfState } from "@repo/lib/overwolf";
import { Move, Scaling } from "lucide-react";
import { useMap } from "../(interactive-map)/store";

export function MapContainer({
  children,
  noLockHover,
}: {
  children?: React.ReactNode;
  noLockHover?: boolean;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap();
  const {
    _hasHydrated,
    lockedWindow,
    mapTransform,
    setMapTransform,
    mapFilter,
    setMapFilter,
    windowOpacity,
    setWindowOpacity,
  } = useSettingsStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const moveableRef = useRef<Moveable>(null);
  const isOverlay = useOverwolfState((state) => state.isOverlay);
  const [isDragging, setIsDragging] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOverlay || !_hasHydrated) {
      return;
    }
    const timeoutId = setTimeout(() => {
      moveableRef.current?.moveable.request(
        "draggable",
        { deltaX: 0, deltaY: 0 },
        true,
      );
    }, 1000);

    const onResize = () => {
      // @ts-ignore
      moveableRef.current?.moveable.request(
        "draggable",
        { deltaX: 0, deltaY: 0 },
        true,
      );
    };
    window.addEventListener("resize", onResize, true);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", onResize, true);
    };
  }, [_hasHydrated]);

  useEffect(() => {
    if (!isOverlay || !_hasHydrated) {
      return;
    }

    if (mapTransform !== null) {
      return;
    }
    console.log(
      `Setting map transform with ${window.innerWidth} and ${window.innerHeight}`,
    );
    setMapTransform({
      transform: `translate(${
        (typeof window !== "undefined" ? window.innerWidth : 1600) - 300
      }px, ${(typeof window !== "undefined" ? window.innerHeight : 1600) - 600}px)`,
      width: "300px",
      height: "300px",
    });
  }, [mapTransform, _hasHydrated]);

  if (!isOverlay) {
    return children;
  }

  if (!_hasHydrated) {
    return <></>;
  }
  return (
    <>
      <div
        ref={mapContainerRef}
        className={cn(`lock absolute inset-0 will-change-transform z-[11000]`, {
          "pointer-events-none": lockedWindow && noLockHover,
        })}
        style={mapTransform || {}}
        onMouseMove={() => {
          if (!lockedWindow || !mapContainerRef.current || noLockHover) {
            return;
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          if (!mapContainerRef.current.classList.contains("lock-opacity")) {
            mapContainerRef.current.classList.add("lock-opacity");
          }

          timeoutRef.current = setTimeout(() => {
            mapContainerRef.current?.classList.remove("lock-opacity");
          }, 1000);
        }}
      >
        {!lockedWindow && (
          <div
            className={cn(
              "absolute -top-6 right-0 flex w-fit rounded-t-lg bg-opacity-50 bg-neutral-800 ml-auto text-neutral-300",
            )}
          >
            <Select value={mapFilter} onValueChange={setMapFilter}>
              <SelectTrigger className="h-full py-0.5 border-none focus:ring-0 w-auto">
                <SelectValue placeholder="Transparency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Transparency</SelectItem>
                <SelectItem value="greyscale">Greyscale</SelectItem>
                <SelectItem value="colorful">Colorful</SelectItem>
                <SelectItem value="full">Full Transparency</SelectItem>
              </SelectContent>
            </Select>
            <Slider
              className="w-24"
              value={[windowOpacity]}
              step={0.05}
              min={0.25}
              max={1}
              onValueChange={(value) => setWindowOpacity(value[0])}
            />
            <div ref={targetRef} className="cursor-move flex items-center p-1">
              <Move className="w-4 h-4" />
            </div>
            <button
              className="cursor-pointer flex items-center p-1"
              onClick={() => setIsEditMode((isEditMode) => !isEditMode)}
              type="button"
            >
              <Scaling className="w-4 h-4" />
            </button>
          </div>
        )}
        <div
          className={cn("h-full w-full", {
            "pointer-events-none": isDragging,
          })}
          style={{
            willChange: "opacity",
            opacity: windowOpacity.toFixed(2),
          }}
        >
          {children}
        </div>
      </div>
      {!lockedWindow && (
        <Moveable
          ref={moveableRef}
          target={mapContainerRef}
          dragTarget={targetRef}
          draggable
          throttleDrag={1}
          resizable={isEditMode}
          hideDefaultLines
          bounds={{ left: 0, top: 24, right: 0, bottom: 0, position: "css" }}
          snappable
          origin={false}
          onDragStart={() => {
            setIsDragging(true);
          }}
          className="!z-[12000]"
          onDrag={(e) => {
            e.target.style.cssText += e.cssText;
          }}
          onDragEnd={() => {
            setIsDragging(false);
          }}
          onResize={(e) => {
            e.target.style.cssText += e.cssText;
          }}
          onRenderEnd={(e) => {
            setMapTransform({
              transform: e.target.style.transform,
              width: e.target.style.width,
              height: e.target.style.height,
            });
            map?.invalidateSize();
          }}
        />
      )}
    </>
  );
}
