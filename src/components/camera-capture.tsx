"use client";

import { useState, useCallback, useRef } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Camera, ImageIcon, X, RotateCcw, Crop as CropIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera, type CompressedImage } from "@/hooks/use-camera";

interface CameraCaptureProps {
  /** Called with the final processed file(s) ready for upload */
  onCapture: (files: File[]) => void;
  /** Enable crop UI after capture (for documents) */
  enableCrop?: boolean;
  /** Max number of files to accept (1 for single capture) */
  maxFiles?: number;
  /** Whether slots are still available */
  disabled?: boolean;
}

export function CameraCapture({
  onCapture,
  enableCrop = false,
  maxFiles = 1,
  disabled = false,
}: CameraCaptureProps) {
  const {
    hasCamera,
    isCompressing,
    cameraInputRef,
    galleryInputRef,
    compressImage,
    openCamera,
    openGallery,
  } = useCamera();

  const [preview, setPreview] = useState<CompressedImage | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [isCropping, setIsCropping] = useState(false);
  const previewImgRef = useRef<HTMLImageElement | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      const compressed = await compressImage(file);
      if (enableCrop) {
        setPreview(compressed);
        setIsCropping(true);
        setCrop(undefined);
      } else {
        setPreview(compressed);
      }
    },
    [compressImage, enableCrop]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      if (maxFiles === 1) {
        await processFile(files[0]);
      } else {
        // Multi-file: compress all and send directly
        const compressed: File[] = [];
        for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
          const result = await compressImage(files[i]);
          compressed.push(result.file);
        }
        onCapture(compressed);
      }

      // Reset the input so the same file can be re-selected
      e.target.value = "";
    },
    [processFile, compressImage, maxFiles, onCapture]
  );

  const handleConfirm = useCallback(() => {
    if (!preview) return;
    onCapture([preview.file]);
    setPreview(null);
    setIsCropping(false);
    setCrop(undefined);
  }, [preview, onCapture]);

  const handleCropConfirm = useCallback(async () => {
    if (!preview || !crop || !previewImgRef.current) return;

    const img = previewImgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const canvas = document.createElement("canvas");
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85)
    );
    const croppedFile = new File([blob], preview.file.name, {
      type: "image/jpeg",
    });
    onCapture([croppedFile]);
    setPreview(null);
    setIsCropping(false);
    setCrop(undefined);
  }, [preview, crop, onCapture]);

  const handleDiscard = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview.preview);
    }
    setPreview(null);
    setIsCropping(false);
    setCrop(undefined);
  }, [preview]);

  const handleRetake = useCallback(() => {
    handleDiscard();
    // Small delay to let state clear before re-opening
    setTimeout(() => openCamera(), 100);
  }, [handleDiscard, openCamera]);

  // Nothing to show on desktop without camera — gallery is handled by dropzone
  if (!hasCamera && !preview) return null;

  return (
    <div className="space-y-3">
      {/* Capture buttons — shown only when no preview active */}
      {!preview && (
        <div className="flex gap-2">
          {hasCamera && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={openCamera}
              disabled={disabled || isCompressing}
            >
              {isCompressing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Foto aufnehmen
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 md:hidden"
            onClick={openGallery}
            disabled={disabled || isCompressing}
          >
            <ImageIcon className="h-4 w-4" />
            Galerie
          </Button>
        </div>
      )}

      {/* Preview with optional crop */}
      {preview && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
          {isCropping && enableCrop ? (
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
              <img
                ref={previewImgRef}
                src={preview.preview}
                alt="Vorschau"
                className="max-h-[300px] w-auto mx-auto rounded"
              />
            </ReactCrop>
          ) : (
            <img
              ref={previewImgRef}
              src={preview.preview}
              alt="Vorschau"
              className="max-h-[300px] w-auto mx-auto rounded"
            />
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {(preview.compressedSize / 1024).toFixed(0)} KB
              {preview.compressedSize < preview.originalSize && (
                <span className="ml-1">
                  (komprimiert von {(preview.originalSize / 1024 / 1024).toFixed(1)} MB)
                </span>
              )}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              type="button"
              size="sm"
              onClick={isCropping && crop ? handleCropConfirm : handleConfirm}
              className="gap-1.5"
            >
              {isCropping && crop ? (
                <>
                  <CropIcon className="h-3.5 w-3.5" />
                  Zuschneiden
                </>
              ) : (
                "Verwenden"
              )}
            </Button>
            {isCropping && crop && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleConfirm}
              >
                Ohne Zuschnitt
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRetake}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Erneut
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive"
              onClick={handleDiscard}
            >
              <X className="h-3.5 w-3.5" />
              Verwerfen
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        multiple={maxFiles > 1}
      />
    </div>
  );
}
