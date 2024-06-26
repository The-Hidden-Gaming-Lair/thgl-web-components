import { cn, useAccountStore, useSettingsStore } from "@repo/lib";
import { useOverwolfState } from "@repo/lib/overwolf";
import { ReactNode, useEffect, useRef, useState } from "react";
import Moveable from "react-moveable";
import { ExternalAnchor } from "../(header)";
import { Move } from "lucide-react";

export function AdsContainer({
  transformId,
  title,
  children,
  className,
}: {
  transformId?: string;
  title: string;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const settingsStore = useSettingsStore();
  const isOverlay = useOverwolfState((state) => state.isOverlay);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);
  const [isDragging, setIsDragging] = useState(false);
  const setShowUserDialog = useAccountStore((state) => state.setShowUserDialog);

  useEffect(() => {
    if (!transformId || !moveableRef.current) {
      return;
    }

    moveableRef.current.moveable.request(
      "draggable",
      { deltaX: 0, deltaY: 0 },
      true,
    );

    const onResize = () => {
      moveableRef.current?.moveable.request(
        "draggable",
        { deltaX: 0, deltaY: 0 },
        true,
      );
    };
    window.addEventListener("resize", onResize, true);

    return () => {
      window.removeEventListener("resize", onResize, true);
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={cn("fixed z-[12000] will-change-transform", className)}
        style={
          transformId
            ? {
                transform: settingsStore.transforms[transformId] ?? "none",
              }
            : {}
        }
      >
        <div
          className={cn(
            "flex w-fit rounded-t-lg bg-background/50 ml-auto text-neutral-300",
            {
              hidden: settingsStore.lockedWindow && isOverlay,
            },
          )}
        >
          {isOverlay && <p className="px-1.5 py-0.5 text-xs">{title}</p>}
          <ExternalAnchor
            href="https://www.th.gl/support-me"
            className="block text-center text-xs px-1.5 py-0.5 group"
            onClick={() => setShowUserDialog(true)}
          >
            Get{" "}
            <span className="text-primary group-hover:underline font-semibold">
              AD-Free
            </span>
          </ExternalAnchor>
          {transformId && (
            <div ref={targetRef} className="cursor-move flex items-center p-1">
              <Move className="w-4 h-4" />
            </div>
          )}
        </div>
        <div className={cn({ "pointer-events-none": isDragging })}>
          {children}
        </div>
      </div>
      {transformId && (
        <Moveable
          ref={moveableRef}
          target={containerRef}
          dragTarget={targetRef}
          draggable
          throttleDrag={1}
          bounds={{ left: 0, top: 30, right: 0, bottom: 0, position: "css" }}
          origin={false}
          hideDefaultLines
          snappable
          onDragStart={() => {
            setIsDragging(true);
          }}
          onDrag={(e) => {
            e.target.style.transform = e.transform;
          }}
          onDragEnd={(e) => {
            settingsStore.setTransform(transformId, e.target.style.transform);
            setIsDragging(false);
          }}
        />
      )}
    </>
  );
}
