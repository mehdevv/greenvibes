import { useNavigate } from "@tanstack/react-router";
import { useListPublishedDestinations } from "@/api";
import type { OffresSearch } from "@/lib/offres-search";
import {
  DURATION_FILTER_OPTIONS,
  EXPERIENCE_FILTER_OPTIONS,
  GUEST_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  SORT_FILTER_OPTIONS,
  DEFAULT_OFFRES_SEARCH,
  offresSearchForUrl,
} from "@/lib/offres-search";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";

type OffersFiltersPanelProps = {
  search: OffresSearch;
  layout?: "sidebar" | "inline";
  className?: string;
};

export function OffersFiltersPanel({
  search,
  layout = "sidebar",
  className,
}: OffersFiltersPanelProps) {
  const navigate = useNavigate();
  const { data: destinations } = useListPublishedDestinations();

  const update = (patch: Partial<OffresSearch>) => {
    navigate({
      to: "/offres",
      search: offresSearchForUrl({ ...search, ...patch }),
      replace: true,
    });
  };

  const reset = () => {
    navigate({
      to: "/offres",
      search: offresSearchForUrl(DEFAULT_OFFRES_SEARCH),
      replace: true,
    });
  };

  const sectionClass = layout === "sidebar" ? "space-y-5" : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";

  return (
    <aside
      className={cn(
        layout === "sidebar" && "rounded-lg border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24",
        className,
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Affiner votre recherche
        </div>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
          <X className="mr-1 h-3.5 w-3.5" />
          Effacer
        </Button>
      </div>

      <div className={sectionClass}>
        <FilterBlock title="Destination">
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!search.destination} onClick={() => update({ destination: "" })}>
              Toutes
            </FilterChip>
            {(destinations ?? []).map((d) => (
              <FilterChip
                key={d.id}
                active={search.destination === d.slug}
                onClick={() => update({ destination: d.slug })}
              >
                {d.title}
              </FilterChip>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock title="Type d'expérience">
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_FILTER_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value || "all"}
                active={search.type === opt.value}
                onClick={() => update({ type: opt.value })}
              >
                {opt.label.replace("Toutes les expériences", "Toutes")}
              </FilterChip>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock title="Durée du circuit">
          <div className="flex flex-wrap gap-2">
            {DURATION_FILTER_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value || "all"}
                active={search.duration === opt.value}
                onClick={() => update({ duration: opt.value })}
              >
                {opt.label.replace("Toute durée", "Toutes")}
              </FilterChip>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock title="Budget max. / personne">
          <Select
            value={search.priceMax || "all"}
            onValueChange={(v) => update({ priceMax: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue placeholder="Tout budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout budget</SelectItem>
              {PRICE_FILTER_OPTIONS.filter((p) => p.value).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBlock>

        <FilterBlock title="Nombre de voyageurs">
          <Select
            value={String(search.guests)}
            onValueChange={(v) => update({ guests: Number(v) })}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GUEST_FILTER_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} voyageur{n > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBlock>

        <FilterBlock title="Organiser par">
          <Select
            value={search.sort || "featured"}
            onValueChange={(v) => update({ sort: v })}
          >
            <SelectTrigger className="h-10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterBlock>
      </div>
    </aside>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Label>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[4px] px-3 py-1.5 text-left text-sm font-medium transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-foreground hover:bg-secondary/80",
      )}
    >
      {children}
    </button>
  );
}
