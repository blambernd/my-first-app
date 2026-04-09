"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 4000;
const INITIAL_QUALITY = 0.8;
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.3;

export interface CompressedImage {
  file: File;
  preview: string;
  originalSize: number;
  compressedSize: number;
}

export function useCamera() {
  const [hasCamera, setHasCamera] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // On mobile browsers, capture attribute works even without enumerateDevices
    // Check for touch capability as a proxy for mobile + camera
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      setHasCamera(true);
      return;
    }
    // On desktop, check for actual camera devices
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          setHasCamera(devices.some((d) => d.kind === "videoinput"));
        })
        .catch(() => setHasCamera(false));
    }
  }, []);

  const compressImage = useCallback(
    async (file: File): Promise<CompressedImage> => {
      setIsCompressing(true);
      try {
        const originalSize = file.size;

        // If already small enough and is JPEG, skip compression
        if (originalSize <= MAX_COMPRESSED_SIZE && file.type === "image/jpeg") {
          const preview = URL.createObjectURL(file);
          return { file, preview, originalSize, compressedSize: originalSize };
        }

        const bitmap = await createImageBitmap(file);
        let { width, height } = bitmap;

        // Scale down if too large
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        // Try decreasing quality until under 2MB
        let quality = INITIAL_QUALITY;
        let blob: Blob;
        do {
          blob = await canvas.convertToBlob({
            type: "image/jpeg",
            quality,
          });
          if (blob.size <= MAX_COMPRESSED_SIZE) break;
          quality -= QUALITY_STEP;
        } while (quality >= MIN_QUALITY);

        const compressedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
          type: "image/jpeg",
        });
        const preview = URL.createObjectURL(compressedFile);

        return {
          file: compressedFile,
          preview,
          originalSize,
          compressedSize: compressedFile.size,
        };
      } finally {
        setIsCompressing(false);
      }
    },
    []
  );

  const openCamera = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const openGallery = useCallback(() => {
    galleryInputRef.current?.click();
  }, []);

  return {
    hasCamera,
    isCompressing,
    cameraInputRef,
    galleryInputRef,
    compressImage,
    openCamera,
    openGallery,
  };
}
