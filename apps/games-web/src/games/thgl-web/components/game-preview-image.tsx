"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Map-preview image for a game card. Falls back to the game logo if the
 * per-game `/opengraph-image.jpg` is missing (404) — e.g. a newly onboarded
 * game whose static OG image hasn't been generated yet. Without this the
 * next/image element renders a broken image with no recovery.
 */
export function GamePreviewImage({
  previewUrl,
  logo,
  title,
}: {
  previewUrl: string;
  logo: string;
  title: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={logo}
          alt={`${title} logo`}
          width={80}
          height={80}
          className="rounded"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <Image
      src={previewUrl}
      alt={`${title} map preview`}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 450px"
      onError={() => setFailed(true)}
    />
  );
}
