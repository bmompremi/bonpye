/**
 * Image optimization utilities for consistent sizing across the app.
 * iOS-safe: uses createImageBitmap when available (avoids canvas memory
 * pressure with large HEIC/HEIF photos), falls back to img+canvas,
 * and finally returns the original file if both fail.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

// Standard max dimensions for different contexts
export const IMAGE_SIZES = {
  avatar: { width: 128, height: 128 },
  header: { width: 1200, height: 300 },
  post: { width: 1200, height: 1200 },
  thumbnail: { width: 200, height: 200 },
};

// Contexts that crop to exact dimensions (square/fixed ratio)
const CROP_CONTEXTS = new Set(["avatar", "header", "thumbnail"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Calculate draw coordinates for centre-crop into (tw × th). */
function cropParams(
  sw: number,
  sh: number,
  tw: number,
  th: number
): [number, number, number, number] {
  const imgRatio = sw / sh;
  const canvasRatio = tw / th;
  let sx = 0,
    sy = 0,
    srcW = sw,
    srcH = sh;
  if (imgRatio > canvasRatio) {
    srcW = sh * canvasRatio;
    sx = (sw - srcW) / 2;
  } else {
    srcH = sw / canvasRatio;
    sy = (sh - srcH) / 2;
  }
  return [sx, sy, srcW, srcH];
}

/** Calculate scale-down dimensions that fit within (maxW × maxH). */
function scaleDims(
  w: number,
  h: number,
  maxW: number,
  maxH: number
): [number, number] {
  if (w <= maxW && h <= maxH) return [w, h];
  const ratio = Math.min(maxW / w, maxH / h);
  return [Math.round(w * ratio), Math.round(h * ratio)];
}

/** Render a canvas and export as JPEG blob. */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas.toBlob returned null"))),
      "image/jpeg",
      quality
    );
  });
}

// ── createImageBitmap path (modern iOS 15+, Chrome, Firefox) ─────────────────

/**
 * Use createImageBitmap to resize *before* allocating canvas memory.
 * This is the most memory-efficient path for large iPhone photos.
 */
async function resizeViaImageBitmap(
  file: File,
  targetW: number,
  targetH: number,
  quality: number
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const [dw, dh] =
    targetW === targetH
      ? [targetW, targetH] // crop contexts use exact size
      : scaleDims(bitmap.width, bitmap.height, targetW, targetH);

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  if (targetW === targetH && bitmap.width !== bitmap.height) {
    // Centre-crop for square canvases (avatar, thumbnail)
    const [sx, sy, srcW, srcH] = cropParams(
      bitmap.width,
      bitmap.height,
      dw,
      dh
    );
    ctx.drawImage(bitmap, sx, sy, srcW, srcH, 0, 0, dw, dh);
  } else {
    ctx.drawImage(bitmap, 0, 0, dw, dh);
  }

  bitmap.close();
  return canvasToBlob(canvas, quality);
}

// ── img + canvas fallback (older browsers) ───────────────────────────────────

function resizeViaImgTag(
  file: File,
  targetW: number,
  targetH: number,
  crop: boolean,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image decode error"));
      img.onload = () => {
        const [dw, dh] = crop
          ? [targetW, targetH]
          : scaleDims(img.width, img.height, targetW, targetH);

        const canvas = document.createElement("canvas");
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No canvas context"));
          return;
        }

        if (crop) {
          const [sx, sy, srcW, srcH] = cropParams(
            img.width,
            img.height,
            dw,
            dh
          );
          ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, dw, dh);
        } else {
          ctx.drawImage(img, 0, 0, dw, dh);
        }

        canvasToBlob(canvas, quality).then(resolve).catch(reject);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Optimise a file before upload.
 *
 * Strategy (in order):
 *  1. createImageBitmap  — best for iOS (no full-res memory spike)
 *  2. img + canvas       — fallback for browsers without createImageBitmap
 *  3. original file blob — last resort so the upload still works
 */
export async function optimizeImageForUpload(
  file: File,
  context: keyof typeof IMAGE_SIZES
): Promise<Blob> {
  const { width, height } = IMAGE_SIZES[context];
  const crop = CROP_CONTEXTS.has(context);
  const quality = crop ? 0.85 : 0.82;

  // Fast path: createImageBitmap (Safari 15+, all modern browsers)
  if (typeof createImageBitmap === "function") {
    try {
      return await resizeViaImageBitmap(file, width, height, quality);
    } catch {
      // fall through to canvas approach
    }
  }

  // Canvas fallback
  try {
    return await resizeViaImgTag(file, width, height, crop, quality);
  } catch {
    // If both fail (e.g. HEIC on very old iOS WebKit), return the original.
    // The server accepts image/* so the raw file will still upload.
    return file;
  }
}

/**
 * Crop + resize image to exact dimensions (legacy helper — kept for compat).
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality = 0.8
): Promise<Blob> {
  return optimizeImageForUpload(file, "avatar");
}

/**
 * Scale down preserving aspect ratio (legacy helper — kept for compat).
 */
export async function scaleImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<Blob> {
  return optimizeImageForUpload(file, "post");
}

/**
 * Get optimised image URL with size parameters (CDN placeholder).
 */
export function getOptimizedImageUrl(
  url: string,
  _context: keyof typeof IMAGE_SIZES
): string {
  return url ?? "";
}
