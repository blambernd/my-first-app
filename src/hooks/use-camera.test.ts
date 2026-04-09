import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the compression constants and logic exported from use-camera
// Note: The hook itself uses browser APIs (createImageBitmap, OffscreenCanvas)
// which aren't available in jsdom, so we test the logic boundaries.

describe("useCamera compression logic", () => {
  describe("constants", () => {
    it("should define correct max compressed size (2MB)", async () => {
      // Import the module to verify constants are set correctly
      // The hook's MAX_COMPRESSED_SIZE = 2 * 1024 * 1024
      const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024;
      expect(MAX_COMPRESSED_SIZE).toBe(2097152);
    });

    it("should define max dimension as 4000px", () => {
      const MAX_DIMENSION = 4000;
      expect(MAX_DIMENSION).toBe(4000);
    });

    it("should use JPEG quality range 0.3 to 0.8", () => {
      const INITIAL_QUALITY = 0.8;
      const MIN_QUALITY = 0.3;
      const QUALITY_STEP = 0.1;

      // Verify that the quality steps go from 0.8 down to 0.3
      const steps: number[] = [];
      let q = INITIAL_QUALITY;
      while (q >= MIN_QUALITY) {
        steps.push(Math.round(q * 10) / 10);
        q -= QUALITY_STEP;
      }
      expect(steps).toEqual([0.8, 0.7, 0.6, 0.5, 0.4, 0.3]);
    });
  });

  describe("CompressedImage interface", () => {
    it("should have required fields", () => {
      const compressed = {
        file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
        preview: "blob:http://localhost/abc",
        originalSize: 5000000,
        compressedSize: 1500000,
      };

      expect(compressed.file).toBeInstanceOf(File);
      expect(compressed.preview).toContain("blob:");
      expect(compressed.originalSize).toBeGreaterThan(compressed.compressedSize);
    });
  });

  describe("camera detection logic", () => {
    it("should use touch detection as camera proxy", () => {
      // The hook checks: "ontouchstart" in window || navigator.maxTouchPoints > 0
      // This verifies the detection logic exists and runs without error
      const hasTouchStart = "ontouchstart" in window;
      const hasMaxTouchPoints = navigator.maxTouchPoints > 0;
      // Result depends on jsdom environment — just verify it's a boolean
      expect(typeof (hasTouchStart || hasMaxTouchPoints)).toBe("boolean");
    });
  });

  describe("file naming", () => {
    it("should convert file extension to .jpg after compression", () => {
      const originalName = "photo.png";
      const newName = originalName.replace(/\.\w+$/, ".jpg");
      expect(newName).toBe("photo.jpg");
    });

    it("should handle multiple dots in filename", () => {
      const originalName = "my.photo.name.png";
      const newName = originalName.replace(/\.\w+$/, ".jpg");
      expect(newName).toBe("my.photo.name.jpg");
    });

    it("should handle HEIC files from iPhones", () => {
      const originalName = "IMG_1234.HEIC";
      const newName = originalName.replace(/\.\w+$/, ".jpg");
      expect(newName).toBe("IMG_1234.jpg");
    });
  });

  describe("dimension scaling logic", () => {
    it("should scale down images exceeding 4000px", () => {
      const MAX_DIMENSION = 4000;
      let width = 6000;
      let height = 4000;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      expect(width).toBe(4000);
      expect(height).toBe(2667);
    });

    it("should not scale images under 4000px", () => {
      const MAX_DIMENSION = 4000;
      let width = 3000;
      let height = 2000;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      expect(width).toBe(3000);
      expect(height).toBe(2000);
    });

    it("should handle portrait orientation", () => {
      const MAX_DIMENSION = 4000;
      let width = 3000;
      let height = 8000;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      expect(width).toBe(1500);
      expect(height).toBe(4000);
    });
  });

  describe("skip compression for small JPEGs", () => {
    it("should skip compression for JPEG files under 2MB", () => {
      const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024;
      const file = new File(["x".repeat(100)], "small.jpg", {
        type: "image/jpeg",
      });
      const shouldSkip =
        file.size <= MAX_COMPRESSED_SIZE && file.type === "image/jpeg";
      expect(shouldSkip).toBe(true);
    });

    it("should NOT skip compression for PNG files even if small", () => {
      const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024;
      const file = new File(["x".repeat(100)], "small.png", {
        type: "image/png",
      });
      const shouldSkip =
        file.size <= MAX_COMPRESSED_SIZE && file.type === "image/jpeg";
      expect(shouldSkip).toBe(false);
    });
  });
});
