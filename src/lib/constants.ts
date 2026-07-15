import heroImg from "@/assets/hero-bejaia.jpg";
import gourayaImg from "@/assets/dest-gouraya.jpg";
import tichyImg from "@/assets/dest-tichy.jpg";
import kherrataImg from "@/assets/dest-kherrata.jpg";
import cornicheImg from "@/assets/dest-corniche.jpg";
import teamImg from "@/assets/about-team.jpg";

/** Bundled fallbacks — always available, no external CDN dependency */
export const PLACEHOLDER_IMAGES = {
  hero: heroImg,
  gouraya: gourayaImg,
  tichy: tichyImg,
  kherrata: kherrataImg,
  corniche: cornicheImg,
  team: teamImg,
} as const;

export function formatPrice(dzd: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(dzd);
}

export function formatPriceLabel(dzd: number): string {
  return `à partir de ${formatPrice(dzd)} DA`;
}

export function availabilityLabel(remaining: number): string {
  if (remaining <= 0) return "Complet";
  if (remaining <= 3) return `${remaining} place${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""}`;
  return "Disponible";
}

export function availabilityColor(remaining: number, capacity: number): string {
  if (remaining <= 0) return "bg-red-500";
  const ratio = remaining / capacity;
  if (ratio <= 0.25) return "bg-orange-500";
  return "bg-leaf";
}

export { DEFAULT_OFFRES_SEARCH, type OffresSearch } from "./offres-search";

export const DEFAULT_RESERVATION_SEARCH = { offer: "", session: "" } as const;

/** Clears the sticky navbar on inner pages */
export const FLOATING_NAV_OFFSET = "pt-6 sm:pt-8";

/** Sticky offset aligned with the navbar */
export const FLOATING_NAV_STICKY = "top-20";

const DESTINATION_COVER_BY_SLUG: Record<string, string> = {
  "parc-gouraya": PLACEHOLDER_IMAGES.gouraya,
  "criques-tichy": PLACEHOLDER_IMAGES.tichy,
  "gorges-kherrata": PLACEHOLDER_IMAGES.kherrata,
  "corniche-bejaia": PLACEHOLDER_IMAGES.corniche,
};

export function destinationCoverFallback(slug: string): string {
  return DESTINATION_COVER_BY_SLUG[slug] ?? PLACEHOLDER_IMAGES.hero;
}

/** Wilayas couvertes par GreenVibes — est & nord de l'Algérie */
export const WILAYAS = [
  { slug: "bejaia", name: "Béjaïa", code: "06" },
  { slug: "jijel", name: "Jijel", code: "18" },
  { slug: "skikda", name: "Skikda", code: "21" },
  { slug: "tizi-ouzou", name: "Tizi Ouzou", code: "15" },
  { slug: "bouira", name: "Bouira", code: "10" },
  { slug: "setif", name: "Sétif", code: "19" },
  { slug: "boumerdes", name: "Boumerdès", code: "35" },
  { slug: "constantine", name: "Constantine", code: "25" },
  { slug: "annaba", name: "Annaba", code: "23" },
  { slug: "batna", name: "Batna", code: "05" },
  { slug: "mila", name: "Mila", code: "43" },
  { slug: "bordj-bou-areridj", name: "Bordj Bou Arréridj", code: "34" },
  { slug: "guelma", name: "Guelma", code: "24" },
  { slug: "tebessa", name: "Tébessa", code: "12" },
  { slug: "blida", name: "Blida", code: "09" },
  { slug: "medea", name: "Médéa", code: "26" },
] as const;

export const AGENCY_CONTACT = {
  phone: "+213559841220",
  phoneDisplay: "05 59 84 12 20",
  email: "clientgreenvibes@gmail.com",
  instagram: "https://www.instagram.com/gree.n_vibes/",
  facebook: "https://www.facebook.com/p/green-vibes-100093088322983/",
  name: "GreenVibes",
  address: "Green travel, Béjaïa, Algérie",
  mapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3197.0822324748215!2d5.0512192!3d36.7445972!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128d33a4692db581%3A0x62f933528f31a9d4!2sGreen%20travel!5e0!3m2!1sen!2sdz!4v1783983696600!5m2!1sen!2sdz",
  mapsLink: "https://maps.google.com/?q=Green+travel+Béjaïa",
  whatsapp: "https://wa.me/213559841220",
  whatsappMessage:
    "Bonjour GreenVibes ! Je souhaite avoir des infos sur vos sorties.",
} as const;

export { tripAvailabilityLabel, tripAvailabilityBarColor, tripSpotsRemaining } from "./availability";
