import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  to?: string;
  params?: Record<string, string>;
};

type AdminBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function AdminBreadcrumbs({ items, className }: AdminBreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex flex-wrap items-center gap-1 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                params={item.params}
                className="text-muted-foreground hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
