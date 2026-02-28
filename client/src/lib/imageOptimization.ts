/**
 * Image optimization utilities for consistent sizing across the app
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

// Standard max dimensions for different contexts
export const IMAGE_SIZES = {
  avatar: { width: 128, height: 128 }, // Profile avatar (square crop)
  header: { width: 1200, height: 300 }, // Profile header (crop to ratio)
  post: { width: 1200, height: 1200 }, // Post images (max bounds, preserve ratio)
  thumbnail: { width: 200, height: 200 }, // Thumbnails (square crop)
};

// Contexts that should crop to exact dimensions (square/fixed ratio)
const CROP_CONTEXTS = new Set(["avatar", "header", "thumbnail"]);

/**
 * Resize image to specified dimensions with cropping (center crop)
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Calculate dimensions to maintain aspect ratio (center crop)
        const imgRatio = img.width / img.height;
        const canvasRatio = targetWidth / targetHeight;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (imgRatio > canvasRatio) {
          sourceWidth = img.height * canvasRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          sourceHeight = img.width / canvasRatio;
          sourceY = (img.height - sourceHeight) / 2;
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Scale down image while preserving aspect ratio (no cropping)
 * Fits within maxWidth x maxHeight bounds
 */
export async function scaleImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        // Only scale down, never scale up
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimize image before upload
 * - avatar/header/thumbnail: crop to exact dimensions
 * - post: scale down preserving aspect ratio (no crop)
 */
export async function optimizeImageForUpload(
  file: File,
  context: keyof typeof IMAGE_SIZES
): Promise<Blob> {
  const dimensions = IMAGE_SIZES[context];

  if (CROP_CONTEXTS.has(context)) {
    return resizeImage(file, dimensions.width, dimensions.height, 0.85);
  }
  // Post images: scale down but preserve full aspect ratio
  return scaleImage(file, dimensions.width, dimensions.height, 0.85);
}

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(
  url: string,
  context: keyof typeof IMAGE_SIZES
): string {
  if (!url) return "";
  // Placeholder for CDN integration
  return url;
}
