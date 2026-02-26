/**
 * Image optimization utilities for consistent sizing across the app
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

// Standard image sizes for different contexts
export const IMAGE_SIZES = {
  avatar: { width: 128, height: 128 }, // Profile avatar
  header: { width: 1200, height: 300 }, // Profile header
  post: { width: 600, height: 600 }, // Post images
  thumbnail: { width: 200, height: 200 }, // Thumbnails in feeds
};

/**
 * Resize image to specified dimensions
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

        // Calculate dimensions to maintain aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = targetWidth / targetHeight;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (imgRatio > canvasRatio) {
          // Image is wider, crop sides
          sourceWidth = img.height * canvasRatio;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller, crop top/bottom
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
 * Optimize image before upload
 */
export async function optimizeImageForUpload(
  file: File,
  context: keyof typeof IMAGE_SIZES
): Promise<Blob> {
  const dimensions = IMAGE_SIZES[context];
  return resizeImage(file, dimensions.width, dimensions.height, 0.85);
}

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(
  url: string,
  context: keyof typeof IMAGE_SIZES
): string {
  if (!url) return "";
  const dimensions = IMAGE_SIZES[context];
  // Add image optimization parameters if using a CDN
  // This is a placeholder for CDN integration
  return url;
}
