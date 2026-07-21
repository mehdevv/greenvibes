import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  variant?: "default" | "primary";
  to?: string;
  onClick?: () => void;
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  variant = "default",
  to,
  onClick,
}: QuickActionCardProps) {
  const className = cn(
    "group flex h-full min-h-[7.5rem] flex-col justify-between rounded-2xl border p-5 text-left transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    variant === "primary"
      ? "border-forest/30 bg-forest text-white shadow-sm hover:bg-forest/90"
      : "border-border bg-card hover:border-forest/25 hover:bg-secondary/40",
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            variant === "primary" ? "bg-white/15" : "bg-forest/10 text-forest",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight
          className={cn(
            "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
            variant === "primary" ? "text-white/80" : "text-muted-foreground",
          )}
        />
      </div>
      <div className="mt-4">
        <p className={cn("font-semibold", variant === "primary" ? "text-white" : "text-foreground")}>
          {title}
        </p>
        <p
          className={cn(
            "mt-1 text-sm leading-snug",
            variant === "primary" ? "text-white/80" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
