/**
 * VideoPlayer — native HTML5 video with tap-to-play overlay and auto-pause on scroll.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { Play, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  maxHeight?: string;
}

export default function VideoPlayer({ src, className = "", maxHeight = "500px" }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState(false);

  // Auto-play AFTER React has committed the <video> element to DOM
  useEffect(() => {
    if (!activated || !videoRef.current) return;
    videoRef.current.play().catch(() => {
      // Autoplay blocked by browser — user can still tap the native controls
    });
  }, [activated]);

  // Auto-pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !activated) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) videoRef.current?.pause(); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activated]);

  const handleActivate = useCallback(() => {
    setError(false);
    setActivated(true);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {!activated ? (
        <div
          className="flex items-center justify-center cursor-pointer bg-black"
          style={{ minHeight: 200, maxHeight }}
          onClick={handleActivate}
        >
          <div className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-8 w-8 fill-white text-white ml-1" />
            </div>
            <span className="text-xs text-white/60">Tap to play</span>
          </div>
        </div>
      ) : error ? (
        <div
          className="flex items-center justify-center bg-black/80"
          style={{ minHeight: 200, maxHeight }}
        >
          <div className="flex flex-col items-center gap-2 text-white/60">
            <AlertCircle className="h-8 w-8" />
            <span className="text-xs">Video unavailable</span>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="auto"
          className="w-full block"
          style={{ maxHeight }}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
