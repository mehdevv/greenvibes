import logoSrc from "@/assets/logo.jpg";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
} as const;

export function Logo({
  size = "md",
  className,
  imageClassName,
  showText = false,
  text = "GreenVibes",
  textClassName,
}: {
  size?: keyof typeof sizeClasses;
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  text?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logoSrc}
        alt="GreenVibes Agency"
        className={cn("shrink-0 rounded-full object-cover shadow-sm", sizeClasses[size], imageClassName)}
      />
      {showText && (
        <span className={cn("font-display text-lg font-light tracking-tight", textClassName)}>
          {text}
        </span>
      )}
    </div>
  );
}
