"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGES_PER_VEHICLE,
} from "@/lib/validations/vehicle";

export interface ImageFile {
  file: File;
  preview: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onImagesChange: (images: ImageFile[]) => void;
  existingImageUrls?: string[];
  onExistingImageRemove?: (url: string) => void;
  maxImages?: number;
}

export function ImageUpload({
  images,
  onImagesChange,
  existingImageUrls = [],
  onExistingImageRemove,
  maxImages = MAX_IMAGES_PER_VEHICLE,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const totalImages = images.length + existingImageUrls.length;
  const remainingSlots = maxImages - totalImages;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length + totalImages > maxImages) {
        setError(`Maximal ${maxImages} Bilder erlaubt. Noch ${remainingSlots} frei.`);
        return;
      }

      const oversized = acceptedFiles.find((f) => f.size > MAX_IMAGE_SIZE_BYTES);
      if (oversized) {
        setError(`"${oversized.name}" ist zu groß. Maximal ${MAX_IMAGE_SIZE_MB} MB pro Bild.`);
        return;
      }

      const newImages: ImageFile[] = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      onImagesChange([...images, ...newImages]);
    },
    [images, onImagesChange, totalImages, maxImages, remainingSlots]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_IMAGE_SIZE_BYTES,
    disabled: remainingSlots <= 0,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        setError(`Datei ist zu groß. Maximal ${MAX_IMAGE_SIZE_MB} MB.`);
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        setError("Nur JPG, PNG und WebP sind erlaubt.");
      }
    },
  });

  const removeNewImage = (index: number) => {
    const updated = [...images];
    URL.revokeObjectURL(updated[index].preview);
    updated.splice(index, 1);
    onImagesChange(updated);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : remainingSlots <= 0
              ? "border-muted bg-muted/20 cursor-not-allowed"
              : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {remainingSlots <= 0 ? (
            <p className="text-sm text-muted-foreground">
              Maximum von {maxImages} Bildern erreicht
            </p>
          ) : isDragActive ? (
            <p className="text-sm text-primary">Bilder hier ablegen…</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Bilder hierher ziehen oder klicken zum Auswählen
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG oder WebP · Max. {MAX_IMAGE_SIZE_MB} MB · Noch {remainingSlots} von {maxImages} frei
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {(existingImageUrls.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {existingImageUrls.map((url) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={url}
                alt="Fahrzeugbild"
                className="w-full h-full object-contain"
              />
              {onExistingImageRemove && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => onExistingImageRemove(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {images.map((image, index) => (
            <div key={image.preview} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={image.preview}
                alt={`Neues Bild ${index + 1}`}
                className="w-full h-full object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeNewImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalImages === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>Noch keine Bilder hochgeladen. Ein Platzhalter wird angezeigt.</span>
        </div>
      )}
    </div>
  );
}
