import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { scaleImage, IMAGE_SIZES } from "@/lib/imageOptimization";
import { toast } from "sonner";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;   // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024;  // 500MB

interface MediaPreviewData {
  url: string;
  type: "image" | "video";
  file: File;
}

export function useMediaUpload() {
  const [preview, setPreview] = useState<MediaPreviewData | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.upload.image.useMutation();
  const uploadVideoMutation = trpc.upload.video.useMutation();

  const openFilePicker = useCallback((type: "image" | "video") => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = type === "image"
      ? "image/jpeg,image/png,image/gif,image/webp"
      : "video/*"; // video/* is required on iOS Safari to show all videos
    fileInputRef.current.click();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    // iOS Safari can report empty MIME type — check extension as fallback
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const videoExts = ['mp4', 'mov', 'webm', 'avi', 'm4v', '3gp'];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/") || videoExts.includes(ext);

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file");
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be under 10MB");
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      toast.error("Video must be under 500MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview({
      url,
      type: isImage ? "image" : "video",
      file,
    });
  }, []);

  const upload = useCallback(async (): Promise<{ imageUrl?: string; videoUrl?: string } | null> => {
    if (!preview) return null;

    setUploading(true);
    try {
      if (preview.type === "image") {
        // Optimize image before upload
        const optimized = await scaleImage(
          preview.file,
          IMAGE_SIZES.post.width,
          IMAGE_SIZES.post.height,
          0.85
        );

        // Convert to base64
        const buffer = await optimized.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        const result = await uploadImageMutation.mutateAsync({
          base64,
          filename: preview.file.name,
          contentType: "image/jpeg",
        });

        return { imageUrl: result.url };
      } else {
        // Video: use multipart/form-data upload (fast, no base64 overhead)
        const formData = new FormData();
        formData.append("video", preview.file);

        const response = await fetch("/api/upload/video", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || "Upload failed");
        }

        const result = await response.json();
        return { videoUrl: result.url };
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload media");
      return null;
    } finally {
      setUploading(false);
    }
  }, [preview, uploadImageMutation, uploadVideoMutation]);

  const clearPreview = useCallback(() => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    setPreview(null);
  }, [preview]);

  return {
    fileInputRef,
    preview,
    uploading,
    openFilePicker,
    handleFileSelect,
    upload,
    clearPreview,
  };
}
