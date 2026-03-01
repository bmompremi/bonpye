/**
 * Lazy VideoPlayer — only loads/plays when user taps.
 * Auto-pauses when scrolled out of view.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { Loader2, Play, Volume2, VolumeX } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  className?: string;
  maxHeight?: string;
}

export default function VideoPlayer({ src, className = "", maxHeight = "500px" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false); // has user clicked play
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Auto-pause when scrolled out of viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activated]);

  const handleActivate = useCallback(() => {
    setActivated(true);
    setLoading(true);
  }, []);

  // Once activated, auto-play after the video element mounts
  useEffect(() => {
    if (!activated) return;
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      setLoading(false);
      video.play().then(() => setPlaying(true)).catch(() => setLoading(false));
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => { setLoading(false); setPlaying(true); };
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    const onLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [activated]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * video.duration;
  }, []);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-2xl overflow-hidden ${className}`}
      style={{ maxHeight }}
      onClick={!activated ? handleActivate : togglePlay}
    >
      {/* Actual video — only rendered after tap */}
      {activated && (
        <video
          ref={videoRef}
          src={src}
          preload="auto"
          playsInline
          muted={muted}
          className="w-full object-contain"
          style={{ maxHeight, display: "block" }}
        />
      )}

      {/* Thumbnail placeholder (before activation) */}
      {!activated && (
        <div
          className="w-full bg-black flex items-center justify-center cursor-pointer"
          style={{ minHeight: 200, maxHeight }}
        >
          {/* Blurred video thumb via poster — just a dark bg with play */}
          <div className="flex flex-col items-center gap-2 text-white/80">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <Play className="h-8 w-8 fill-white text-white ml-1" />
            </div>
            <span className="text-xs text-white/60">Tap to play</span>
          </div>
        </div>
      )}

      {/* Buffering spinner */}
      {activated && loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
      )}

      {/* Play/Pause overlay (shows briefly on tap) */}
      {activated && !loading && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity pointer-events-none ${playing ? "opacity-0" : "opacity-100"}`}>
          <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="h-7 w-7 fill-white text-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      {activated && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-white text-xs tabular-nums">
              {formatTime((progress / 100) * duration)} / {formatTime(duration)}
            </span>
            <button
              onClick={toggleMute}
              className="p-1 text-white hover:text-white/80"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
