"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { cn, useSettingsStore } from "@repo/lib";
import { Move, Settings, Maximize2, Minimize2 } from "lucide-react";
import { useMap } from "../(interactive-map)/store";
import { Toggle } from "../ui/toggle";
import { Button } from "../(controls)";

export function MapContainer({
  children,
  noLockHover,
  isOverlay,
}: {
  children?: React.ReactNode;
  noLockHover?: boolean;
  isOverlay: boolean;
}) {
  const targetRef = useRef<HTMLButtonElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
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
    overlayFullscreen,
    toggleOverlayFullscreen,
  } = useSettingsStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const moveableRef = useRef<Moveable>(null);
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
      borderRadius: "0px",
      transform: `translate(${
        (typeof window !== "undefined" ? window.innerWidth : 1600) - 300
      }px, ${(typeof window !== "undefined" ? window.innerHeight : 1600) - 600}px)`,
      width: "300px",
      height: "300px",
    });
  }, [mapTransform, _hasHydrated]);

  // Invalidate map size when toggling fullscreen to force a resize
  useEffect(() => {
    if (!isOverlay || !_hasHydrated) return;
    map?.invalidateSize();
  }, [overlayFullscreen]);

  if (!isOverlay) {
    return children;
  }

  if (!_hasHydrated) {
    return <></>;
  }

  // Fullscreen overlay mode: occupy entire window with simple wrapper and exit control
  if (overlayFullscreen) {
    return (
      <>
        <div
          ref={mapContainerRef}
          className={cn("absolute inset-0 will-change-transform z-10", {
            "pointer-events-none": lockedWindow && noLockHover,
          })}
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
                "absolute z-10 top-[40px] left-1/2 -translate-x-1/2 flex overflow-hidden rounded-lg bg-card",
              )}
            >
              <Button
                className="rounded-none"
                size="icon"
                variant="secondary"
                onClick={toggleOverlayFullscreen}
                aria-label="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Toggle
                className="rounded-none"
                aria-label="Toggle Map Settings"
                onClick={() => setIsEditMode((isEditMode) => !isEditMode)}
              >
                <Settings className="w-4 h-4" />
              </Toggle>
              {isEditMode && (
                <>
                  <Select value={mapFilter} onValueChange={setMapFilter}>
                    <SelectTrigger className="w-fit focus:ring-0 rounded-none">
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
                    className="w-24 px-1"
                    value={[windowOpacity]}
                    step={0.05}
                    min={0.25}
                    max={1}
                    onValueChange={(value) => setWindowOpacity(value[0])}
                  />
                </>
              )}
            </div>
          )}
          <div
            className={cn("h-full w-full overflow-hidden")}
            style={{ willChange: "opacity", opacity: windowOpacity.toFixed(2) }}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
  const { borderRadius, ...mapTransformWithoutBorderRadius } =
    mapTransform || {};
  return (
    <>
      <div
        ref={mapContainerRef}
        className={cn(`lock absolute inset-0 will-change-transform z-[11000]`, {
          "pointer-events-none": lockedWindow && noLockHover,
        })}
        style={mapTransformWithoutBorderRadius}
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
              "absolute z-10 top-2 left-1/2 -translate-x-1/2  flex overflow-hidden rounded-lg bg-card",
            )}
          >
            {isEditMode && (
              <>
                <Select value={mapFilter} onValueChange={setMapFilter}>
                  <SelectTrigger className="w-fit focus:ring-0 rounded-none">
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
                  className="w-24 px-1"
                  value={[windowOpacity]}
                  step={0.05}
                  min={0.25}
                  max={1}
                  onValueChange={(value) => setWindowOpacity(value[0])}
                />
              </>
            )}
            <Button
              ref={targetRef}
              className="cursor-move rounded-none"
              size="icon"
              variant="secondary"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              className="rounded-none"
              size="icon"
              variant="secondary"
              onClick={toggleOverlayFullscreen}
              aria-label="Enter Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Toggle
              className="rounded-none"
              aria-label="Toggle Map Settings"
              onClick={() => setIsEditMode((isEditMode) => !isEditMode)}
            >
              <Settings className="w-4 h-4" />
            </Toggle>
          </div>
        )}
        <div
          ref={mapRef}
          className={cn("h-full w-full overflow-hidden")}
          style={{
            willChange: "opacity",
            opacity: windowOpacity.toFixed(2),
            borderRadius: borderRadius,
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
          roundPadding={15}
          roundable={isEditMode}
          isDisplayShadowRoundControls="horizontal"
          onDragStart={() => {
            mapRef.current!.classList.add("pointer-events-none");
          }}
          className="!z-[12000]"
          onDragEnd={() => {
            mapRef.current!.classList.remove("pointer-events-none");
          }}
          onRound={(e) => {
            mapRef.current!.style.borderRadius = e.borderRadius;
          }}
          onRender={(e) => {
            e.target.style.cssText += e.cssText;
          }}
          onRenderEnd={(e) => {
            setMapTransform({
              borderRadius: mapRef.current!.style.borderRadius,
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
