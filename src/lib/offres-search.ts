import type { Offer } from "@/api/types";

export type OffresSearch = {
  destination: string;
  guests: number;
  type: string;
  duration: string;
  priceMax: string;
  sort: string;
};

export const DEFAULT_OFFRES_SEARCH: OffresSearch = {
  destination: "",
  guests: 2,
  type: "",
  duration: "",
  priceMax: "",
  sort: "featured",
};

export const EXPERIENCE_FILTER_OPTIONS = [
  { value: "", label: "Toutes les expériences" },
  { value: "mer", label: "Mer & côtes" },
  { value: "montagne", label: "Montagne & randonnée" },
  { value: "culture", label: "Culture & patrimoine" },
  { value: "aventure", label: "Aventure & sensations" },
] as const;

export const DURATION_FILTER_OPTIONS = [
  { value: "", label: "Toute durée" },
  { value: "journee", label: "À la journée" },
  { value: "weekend", label: "Week-end (2–3 jours)" },
  { value: "sejour", label: "Séjour (4 jours et +)" },
] as const;

export const PRICE_FILTER_OPTIONS = [
  { value: "", label: "Tout budget" },
  { value: "5000", label: "Jusqu'à 5 000 DA / pers." },
  { value: "10000", label: "Jusqu'à 10 000 DA / pers." },
  { value: "15000", label: "Jusqu'à 15 000 DA / pers." },
  { value: "25000", label: "Jusqu'à 25 000 DA / pers." },
] as const;

export const SORT_FILTER_OPTIONS = [
  { value: "featured", label: "Recommandés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "duration-asc", label: "Durée courte d'abord" },
] as const;

export const GUEST_FILTER_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20] as const;

const EXPERIENCE_LABELS: Record<string, string> = {
  mer: "Mer",
  montagne: "Montagne",
  culture: "Culture",
  aventure: "Aventure",
};

export function parseOffresSearch(search: Record<string, unknown>): OffresSearch {
  const guests = Number(search.guests);
  return {
    destination: typeof search.destination === "string" ? search.destination : "",
    guests: Number.isFinite(guests) && guests >= 1 ? Math.min(20, guests) : 2,
    type: typeof search.type === "string" ? search.type : "",
    duration: typeof search.duration === "string" ? search.duration : "",
    priceMax: typeof search.priceMax === "string" ? search.priceMax : "",
    sort: typeof search.sort === "string" && search.sort ? search.sort : "featured",
  };
}

function matchesDuration(durationLabel: string, filter: string): boolean {
  if (!filter) return true;
  const label = durationLabel.toLowerCase();
  if (filter === "journee") {
    return /journée|journee|jour\b|1 jour|demi/i.test(label);
  }
  if (filter === "weekend") {
    return /week|week-end|weekend|2 jour|3 jour|deux jour/i.test(label);
  }
  if (filter === "sejour") {
    return (
      /séjour|sejour|4 jour|5 jour|6 jour|7 jour|semaine/i.test(label) ||
      (!/journée|journee|week|2 jour|3 jour/i.test(label) && /\d+\s*jour/.test(label))
    );
  }
  return true;
}

export function filterAndSortOffers(offers: Offer[], search: OffresSearch): Offer[] {
  const priceMax = search.priceMax ? Number(search.priceMax) : null;

  let result = offers.filter((o) => {
    if (search.type && o.offerType !== search.type) return false;
    if (search.destination && o.destination?.slug !== search.destination) return false;
    if (priceMax != null && o.priceDzd > priceMax) return false;
    if (!matchesDuration(o.durationLabel, search.duration)) return false;
    return true;
  });

  switch (search.sort) {
    case "price-asc":
      result = [...result].sort((a, b) => a.priceDzd - b.priceDzd);
      break;
    case "price-desc":
      result = [...result].sort((a, b) => b.priceDzd - a.priceDzd);
      break;
    case "duration-asc":
      result = [...result].sort((a, b) => a.durationLabel.localeCompare(b.durationLabel, "fr"));
      break;
    case "featured":
    default:
      result = [...result].sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      });
      break;
  }

  return result;
}

export function offresSearchToParams(search: OffresSearch): OffresSearch {
  return {
    destination: search.destination,
    guests: search.guests,
    type: search.type,
    duration: search.duration,
    priceMax: search.priceMax,
    sort: search.sort === "featured" ? "" : search.sort,
  };
}

/** For URL: omit empty optional fields */
export function offresSearchForUrl(search: Partial<OffresSearch>): Record<string, string | number> {
  const full = { ...DEFAULT_OFFRES_SEARCH, ...search };
  return {
    destination: full.destination,
    guests: full.guests,
    type: full.type,
    duration: full.duration,
    priceMax: full.priceMax,
    sort: full.sort === "featured" ? "" : full.sort,
  };
}

export function describeActiveFilters(search: OffresSearch, destinationTitle?: string): string[] {
  const parts: string[] = [];
  if (destinationTitle) parts.push(destinationTitle);
  if (search.type) parts.push(EXPERIENCE_LABELS[search.type] ?? search.type);
  if (search.duration) {
    parts.push(DURATION_FILTER_OPTIONS.find((d) => d.value === search.duration)?.label ?? search.duration);
  }
  if (search.priceMax) {
    parts.push(PRICE_FILTER_OPTIONS.find((p) => p.value === search.priceMax)?.label ?? `≤ ${search.priceMax} DA`);
  }
  parts.push(`${search.guests} voyageur${search.guests > 1 ? "s" : ""}`);
  return parts;
}

export function countActiveFilters(search: OffresSearch): number {
  let n = 0;
  if (search.destination) n += 1;
  if (search.type) n += 1;
  if (search.duration) n += 1;
  if (search.priceMax) n += 1;
  if (search.guests !== 2) n += 1;
  if (search.sort && search.sort !== "featured") n += 1;
  return n;
}
