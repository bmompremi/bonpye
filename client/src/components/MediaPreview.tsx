import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaPreviewProps {
  url: string;
  type: "image" | "video";
  onClear: () => void;
}

export function MediaPreview({ url, type, onClear }: MediaPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="relative inline-block m-2"
    >
      {type === "image" ? (
        <img
          src={url}
          alt="Preview"
          className="max-h-32 max-w-48 rounded-xl object-cover border border-border"
        />
      ) : (
        <video
          src={url}
          className="max-h-32 max-w-48 rounded-xl object-cover border border-border"
          muted
        />
      )}
      <button
        onClick={onClear}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

interface ImageLightboxProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.img
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          src={imageUrl}
          alt="Full size"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
