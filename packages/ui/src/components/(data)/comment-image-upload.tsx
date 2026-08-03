"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@repo/lib";
import { postWebviewMessage } from "@repo/lib/thgl-app";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../(controls)";

const MAX_FILES = 3;
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/**
 * Validates incoming files against the comment image constraints (type
 * whitelist, 2MB size limit, max count, dedup) and returns the new image
 * list. Rejections surface as toasts — silent drops made users think the
 * upload worked when the server would later reject it.
 */
export function appendCommentImages(
  current: File[],
  incoming: FileList | File[],
  existingCount = 0,
): File[] {
  const remaining = MAX_FILES - current.length - existingCount;
  const seen = new Set(current.map((f) => `${f.name}:${f.size}`));
  const valid: File[] = [];
  for (const file of Array.from(incoming)) {
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error(
        `${file.name || "Image"}: unsupported type. Use PNG, JPEG, WebP or GIF.`,
      );
      continue;
    }
    if (file.size > MAX_SIZE) {
      toast.error(
        `${file.name || "Image"} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB, max 2MB).`,
      );
      continue;
    }
    const key = `${file.name}:${file.size}`;
    if (seen.has(key)) continue;
    if (valid.length >= remaining) {
      toast.error(`Maximum ${MAX_FILES} images per comment.`);
      break;
    }
    seen.add(key);
    valid.push(file);
  }
  return valid.length > 0 ? [...current, ...valid] : current;
}

export function CommentImageUpload({
  images,
  onImagesChange,
  existingImages,
  onExistingImageRemove,
  showScreenshot,
}: {
  images: File[];
  onImagesChange: (files: File[]) => void;
  existingImages?: { id: number; url: string }[];
  onExistingImageRemove?: (id: number) => void;
  showScreenshot?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const totalCount = images.length + (existingImages?.length ?? 0);
  const canAdd = totalCount < MAX_FILES;

  const validateAndAdd = useCallback(
    (files: FileList | File[]) => {
      const next = appendCommentImages(
        images,
        files,
        existingImages?.length ?? 0,
      );
      if (next !== images) {
        onImagesChange(next);
      }
    },
    [images, existingImages, onImagesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAdd(e.dataTransfer.files);
      }
    },
    [validateAndAdd],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const files = Array.from(e.clipboardData.items)
        .filter((item) => item.kind === "file" && /^image\//.test(item.type))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length > 0) {
        e.preventDefault();
        // Don't let the paste bubble to the surrounding comment form's
        // onPaste — it would add the same files a second time.
        e.stopPropagation();
        validateAndAdd(files);
      }
    },
    [validateAndAdd],
  );

  const handleScreenshot = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const response = await postWebviewMessage<string>(
        { action: "captureGameScreenshot", payload: {} },
        10000,
      );
      if (response.status === "success" && response.data) {
        const res = await fetch(response.data);
        const blob = await res.blob();
        const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
        validateAndAdd([file]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Screenshot capture failed";
      toast.error(msg);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, validateAndAdd]);

  const removeNew = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const hasAny = totalCount > 0;

  return (
    <div className="relative" onPaste={handlePaste}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) validateAndAdd(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Dropzone */}
      <div
        className={cn(
          "rounded-md border border-dashed px-3 py-2 transition-colors",
          canAdd && "cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
        onClick={() => canAdd && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (canAdd) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={handleDrop}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Existing image thumbnails (edit mode) */}
          {existingImages?.map((img) => (
            <div key={`existing-${img.id}`} className="group relative shrink-0">
              <img
                src={img.url}
                alt=""
                className="h-14 w-14 rounded object-cover border border-border"
              />
              {onExistingImageRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExistingImageRemove(img.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}

          {/* New file thumbnails */}
          {images.map((file, i) => (
            <Thumbnail
              key={`new-${i}`}
              file={file}
              onRemove={() => removeNew(i)}
            />
          ))}

          {/* Hint when no images */}
          {!hasAny && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImagePlus className="h-3.5 w-3.5 shrink-0" />
              <span>Drop or paste images</span>
            </div>
          )}

          {/* Counter when has images */}
          {hasAny && (
            <span className="text-xs text-muted-foreground">
              {totalCount}/{MAX_FILES}
            </span>
          )}
        </div>
      </div>

      {/* Screenshot button */}
      {showScreenshot && canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs mt-1.5"
          onClick={handleScreenshot}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
          Screenshot
        </Button>
      )}
    </div>
  );
}

function Thumbnail({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemoObjectURL(file);

  return (
    <div className="group relative shrink-0">
      <img
        src={url}
        alt=""
        className="h-14 w-14 rounded object-cover border border-border"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function useMemoObjectURL(file: File): string {
  const ref = useRef<{ file: File; url: string } | null>(null);
  if (!ref.current || ref.current.file !== file) {
    if (ref.current) URL.revokeObjectURL(ref.current.url);
    ref.current = { file, url: URL.createObjectURL(file) };
  }
  return ref.current.url;
}
