/**
 * VideoPlayer — uses Plyr for smooth, native-quality playback.
 * Lazy: only mounts the player when user taps. Auto-pauses on scroll.
 */
import { useRef, useState, useEffect } from "react";
import { Play } from "lucide-react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  src: string;
  className?: string;
  maxHeight?: string;
}

export default function VideoPlayer({ src, className = "", maxHeight = "500px" }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [activated, setActivated] = useState(false);

  // Init Plyr once activated
  useEffect(() => {
    if (!activated || !videoRef.current) return;

    playerRef.current = new Plyr(videoRef.current, {
      controls: ["play", "progress", "current-time", "mute", "volume", "fullscreen"],
      resetOnEnd: true,
      hideControls: true,
      clickToPlay: true,
      disableContextMenu: false,
      storage: { enabled: false },
    });

    // Auto-play after init
    playerRef.current.play().catch(() => {});

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [activated]);

  // Auto-pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !activated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          playerRef.current?.pause();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activated]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {!activated && (
        /* Tap-to-play overlay — no network request until tapped */
        <div
          className="flex items-center justify-center cursor-pointer bg-black"
          style={{ minHeight: 200, maxHeight }}
          onClick={() => setActivated(true)}
        >
          <div className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="h-8 w-8 fill-white text-white ml-1" />
            </div>
            <span className="text-xs text-white/60">Tap to play</span>
          </div>
        </div>
      )}

      {activated && (
        <video
          ref={videoRef}
          src={src}
          playsInline
          preload="auto"
          className="w-full"
          style={{ maxHeight, display: "block" }}
        />
      )}
    </div>
  );
}
