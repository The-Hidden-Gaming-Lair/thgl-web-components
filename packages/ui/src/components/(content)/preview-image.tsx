"use client";

import { cn } from "@repo/lib";
import Image from "next/image";
import { useEffect, useState } from "react";

export function PreviewImage({ src, alt }: { src: string; alt?: string }) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  // ESC key listener
  useEffect(() => {
    if (!isHighlighted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHighlighted(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHighlighted]);

  return (
    <>
      <Image
        key={src}
        src={src}
        alt={alt || ""}
        className={cn("rounded-lg object-cover cursor-zoom-in")}
        width={258}
        height={198}
        onClick={() => setIsHighlighted(true)}
      />
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center cursor-zoom-out transition-all",
          isHighlighted
            ? "bg-black/50 opacity-100 "
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsHighlighted(false)}
      >
        {isHighlighted && (
          <Image
            key={src + "large"}
            src={src}
            alt={alt || ""}
            className={cn("rounded-lg object-scale-down p-8 ")}
            fill
          />
        )}
      </div>
    </>
  );
}
