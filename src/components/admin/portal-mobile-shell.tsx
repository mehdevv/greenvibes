import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PortalNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type PortalMobileDrawerProps = {
  title: string;
  subtitle: string;
  items: PortalNavItem[];
  pathname: string;
  userLabel: string;
  readOnly?: boolean;
  onNavigate?: () => void;
  onSignOut: () => void | Promise<void>;
};

export function PortalMobileDrawerContent({
  title,
  subtitle,
  items,
  pathname,
  userLabel,
  readOnly,
  onNavigate,
  onSignOut,
}: PortalMobileDrawerProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-1 pb-4">
        <Logo size="sm" />
        <div className="min-w-0">
          <div className="font-display text-sm font-bold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-2 truncate px-3 text-sm text-muted-foreground">{userLabel}</div>
        {readOnly && <div className="mb-2 px-3 text-xs text-orange-600">Lecture seule</div>}
        <Button
          variant="ghost"
          className="h-11 w-full justify-start gap-3 text-base"
          onClick={() => void onSignOut()}
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

type PortalBottomNavProps = {
  items: PortalNavItem[];
  pathname: string;
  onMore?: () => void;
};

export function PortalBottomNav({ items, pathname, onMore }: PortalBottomNavProps) {
  const primary = items.slice(0, 3);
  const hasMore = items.length > 3 || onMore;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation principale"
    >
      <div className="flex items-stretch">
        {primary.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              className={cn(
                "flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition",
                active ? "text-forest" : "text-muted-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-forest")} />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
        {hasMore && onMore && (
          <button
            type="button"
            onClick={onMore}
            className="flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium text-muted-foreground"
          >
            <span className="flex h-5 w-5 items-center justify-center text-lg leading-none">⋯</span>
            <span>Menu</span>
          </button>
        )}
      </div>
    </nav>
  );
}
