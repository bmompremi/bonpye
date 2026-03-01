/**
 * VideoPlayer — native HTML5 video with tap-to-play overlay and auto-pause on scroll.
 * No external library dependencies.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  maxHeight?: string;
}

export default function VideoPlayer({ src, className = "", maxHeight = "500px" }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activated, setActivated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !activated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activated]);

  const handleActivate = useCallback(() => {
    setActivated(true);
    setIsPlaying(true);
    // Small delay so React commits the <video> to DOM first
    requestAnimationFrame(() => {
      videoRef.current?.play().catch(() => {});
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {!activated ? (
        /* Tap-to-play overlay — no network request until tapped */
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
      ) : (
        <video
          ref={videoRef}
          src={src}
          controls
          playsInline
          preload="auto"
          className="w-full block"
          style={{ maxHeight }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
