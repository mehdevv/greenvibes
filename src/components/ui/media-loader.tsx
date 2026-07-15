import { ImageIcon, Loader2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useState,
  type ImgHTMLAttributes,
  type VideoHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type OverlayProps = {
  label?: string;
  className?: string;
  dark?: boolean;
};

export function MediaLoadingOverlay({
  label = "Chargement…",
  className,
  dark = false,
}: OverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2",
        dark ? "bg-black/40" : "bg-secondary/75 backdrop-blur-[2px]",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2
        className={cn("h-8 w-8 animate-spin", dark ? "text-white" : "text-forest")}
      />
      <span
        className={cn(
          "text-xs font-medium",
          dark ? "text-white/90" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

type LoadingImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  containerClassName?: string;
  loaderLabel?: string;
  darkLoader?: boolean;
};

export function LoadingImage({
  className,
  containerClassName,
  loaderLabel,
  darkLoader,
  onLoad,
  onError,
  src,
  ...props
}: LoadingImageProps) {
  const [loading, setLoading] = useState(Boolean(src));
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(Boolean(src));
    setError(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-secondary/50", containerClassName)}>
      {loading && !error && (
        <MediaLoadingOverlay label={loaderLabel} dark={darkLoader} />
      )}
      {error ? (
        <div className="flex min-h-[8rem] w-full items-center justify-center bg-secondary text-muted-foreground">
          <ImageIcon className="h-9 w-9 opacity-35" aria-hidden />
        </div>
      ) : (
        <img
          {...props}
          src={src}
          className={cn(
            "h-full w-full transition-opacity duration-300",
            loading ? "opacity-0" : "opacity-100",
            className,
          )}
          onLoad={(e) => {
            setLoading(false);
            setError(false);
            onLoad?.(e);
          }}
          onError={(e) => {
            setLoading(false);
            setError(true);
            onError?.(e);
          }}
        />
      )}
    </div>
  );
}

type LoadingVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  containerClassName?: string;
  loaderLabel?: string;
  darkLoader?: boolean;
};

export const LoadingVideo = forwardRef<HTMLVideoElement, LoadingVideoProps>(
  function LoadingVideo(
    {
      className,
      containerClassName,
      loaderLabel = "Chargement de la vidéo…",
      darkLoader,
      onCanPlay,
      onLoadedData,
      onWaiting,
      onPlaying,
      children,
      ...props
    },
    ref,
  ) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      setLoading(true);
    }, [props.src]);

    return (
      <div className={cn("relative overflow-hidden bg-secondary/50", containerClassName)}>
        {loading && <MediaLoadingOverlay label={loaderLabel} dark={darkLoader} />}
        <video
          {...props}
          ref={ref}
          className={cn(
            "h-full w-full transition-opacity duration-500",
            loading ? "opacity-0" : "opacity-100",
            className,
          )}
          onLoadedData={(e) => {
            setLoading(false);
            onLoadedData?.(e);
          }}
          onCanPlay={(e) => {
            setLoading(false);
            onCanPlay?.(e);
          }}
          onWaiting={(e) => {
            setLoading(true);
            onWaiting?.(e);
          }}
          onPlaying={(e) => {
            setLoading(false);
            onPlaying?.(e);
          }}
        >
          {children}
        </video>
      </div>
    );
  },
);
