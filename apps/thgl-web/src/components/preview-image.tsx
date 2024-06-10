"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export default function PreviewImage({ src }: { src: string }) {
  const [isHighlighted, setIsHighlighted] = useState(false);

  return (
    <>
      <Image
        key={src}
        src={src}
        alt=""
        className={cn("rounded-lg object-cover cursor-zoom-in")}
        width={258}
        height={198}
        onClick={() => setIsHighlighted(true)}
      />
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center cursor-zoom-out transition-all",
          isHighlighted
            ? "bg-black/50 opacity-100 "
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsHighlighted(false)}
      >
        {isHighlighted && (
          <Image
            src={src}
            alt=""
            className={cn("rounded-lg object-scale-down p-8 ")}
            fill
          />
        )}
      </div>
    </>
  );
}
