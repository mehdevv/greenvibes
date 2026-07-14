import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  src: string;
  poster: string;
  className?: string;
  videoClassName?: string;
  overlay?: ReactNode;
  rounded?: string;
};

export function VideoPlayer({
  src,
  poster,
  className,
  videoClassName,
  overlay,
  rounded = "rounded-2xl",
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const onTime = () => {
      if (!video.duration || !Number.isFinite(video.duration)) return;
      setProgress((video.currentTime / video.duration) * 100);
    };

    const onProgress = () => {
      if (!video.duration || !Number.isFinite(video.duration) || video.buffered.length === 0) return;
      const end = video.buffered.end(video.buffered.length - 1);
      setBuffered(Math.min(100, (end / video.duration) * 100));
    };

    const onWaiting = () => setLoading(true);
    const onCanPlay = () => {
      setLoading(false);
      setReady(true);
    };
    const onPlaying = () => {
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("progress", onProgress);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 2) {
      setLoading(false);
      setReady(true);
    }

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      setLoading(true);
      video.play().catch(() => setLoading(false));
    } else {
      video.pause();
    }
  };

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const video = ref.current;
    if (!video?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio * 100);
  };

  return (
    <div className={cn("group relative overflow-hidden bg-card", rounded, className)}>
      <video
        ref={ref}
        poster={poster}
        playsInline
        preload="metadata"
        className={cn("h-full w-full object-cover", videoClassName)}
      >
        <source src={src} type="video/mp4" />
      </video>

      {!playing && (
        <img
          src={poster}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      <button
        type="button"
        onClick={toggle}
        className={cn(
          "absolute inset-x-0 top-0 bottom-8 z-[1] flex items-center justify-center transition",
          playing ? "bg-transparent hover:bg-black/10" : "bg-black/30 hover:bg-black/35",
        )}
        aria-label={playing ? "Pause" : "Lire la vidéo"}
      >
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full bg-white text-forest shadow-soft transition",
            playing && "opacity-0 group-hover:opacity-100",
          )}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </span>
      </button>

      {overlay && <div className="pointer-events-none absolute inset-0 z-[2]">{overlay}</div>}

      <div className="absolute inset-x-0 bottom-0 z-[3] px-3 pb-3 pt-8">
        {loading && (
          <div className="mb-2 h-0.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-2/5 animate-loading-bar rounded-full bg-leaf" />
          </div>
        )}
        <div
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Progression vidéo"
          tabIndex={0}
          onClick={seek}
          className="relative h-1 cursor-pointer overflow-hidden rounded-full bg-white/25"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-[width] duration-150"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-leaf transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
