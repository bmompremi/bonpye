/**
 * VideoPlayer — shows first-frame thumbnail immediately (preload="metadata"),
 * overlays a play button, and reveals native controls on tap.
 * Auto-pauses when scrolled out of view.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { Play, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  maxHeight?: string;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ src, className = "", maxHeight = "500px" }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  // Auto-pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePlay = useCallback(() => {
    if (!videoRef.current) return;
    setPlaying(true);
    videoRef.current.play().catch(() => setPlaying(false));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {error ? (
        <div
          className="flex items-center justify-center bg-zinc-900"
          style={{ minHeight: 200, maxHeight }}
        >
          <div className="flex flex-col items-center gap-2 text-white/50">
            <AlertCircle className="h-8 w-8" />
            <span className="text-xs">Video unavailable</span>
          </div>
        </div>
      ) : (
        <>
          {/* Video element — preload="metadata" loads the first frame as thumbnail */}
          <video
            ref={videoRef}
            src={src}
            playsInline
            preload="metadata"
            controls={playing}
            className="w-full block"
            style={{ maxHeight }}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setError(true)}
          />

          {/* Play overlay — shown when not playing */}
          {!playing && (
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={handlePlay}
            >
              {/* Semi-dark scrim so play button pops */}
              <div className="absolute inset-0 bg-black/20" />

              {/* Play button */}
              <div className="relative w-16 h-16 rounded-full bg-white/90 shadow-xl flex items-center justify-center">
                <Play className="h-7 w-7 fill-black text-black ml-1" />
              </div>

              {/* Duration badge bottom-right */}
              {duration != null && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-2 py-0.5 rounded">
                  {formatDuration(duration)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
