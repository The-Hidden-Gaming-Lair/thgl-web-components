"use client";
import type { MouseEvent, JSX } from "react";
import { isThglApp } from "@repo/lib";

/**
 * Invisible draggable border handles around the window edges.
 * Used exclusively in the standalone desktop THGLApp to enable native window resizing.
 */
export function ResizeBorders(): JSX.Element | null {
  if (!isThglApp) {
    return null;
  }

  function onDragResize(edge: string) {
    return (event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>) => {
      event.stopPropagation();
      window.chrome?.webview?.postMessage(edge);
    };
  }

  return (
    <>
      <div
        className="fixed pointer-events-auto z-999999 top-0 left-0 right-0 h-1.5 cursor-n-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeTop")}
      />
      <div
        className="fixed pointer-events-auto z-999999 top-0 bottom-0 right-0 w-1.5 cursor-e-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeRight")}
      />
      <div
        className="fixed pointer-events-auto z-999999 bottom-0 left-0 right-0 h-1.5 cursor-s-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeBottom")}
      />
      <div
        className="fixed pointer-events-auto z-999999 top-0 left-0 bottom-0 w-1.5 cursor-w-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeLeft")}
      />
      <div
        className="fixed pointer-events-auto z-999999 top-0 left-0 h-1.5 w-1.5 cursor-nw-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeTopLeft")}
      />
      <div
        className="fixed pointer-events-auto z-999999 top-0 right-0 h-1.5 w-1.5 cursor-ne-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeTopRight")}
      />
      <div
        className="fixed pointer-events-auto z-999999 bottom-0 left-0 h-1.5 w-1.5 cursor-sw-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeBottomLeft")}
      />
      <div
        className="fixed pointer-events-auto z-999999 bottom-0 right-0 h-1.5 w-1.5 cursor-se-resize bg-neutral-800/5"
        onMouseDown={onDragResize("resizeBottomRight")}
      />
    </>
  );
}
