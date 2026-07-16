import type { Trip } from "@/api/types";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { DEFAULT_LIST_COLUMNS } from "@/lib/trip-list-columns";

function futureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/** Offline preview when `trips` table is not migrated yet */
export const DEMO_TRIPS: Trip[] = [
  {
    id: "a1000000-0000-4000-8000-000000000001",
    slug: "criques-tichy",
    title: "Criques de Tichy — Demi-journée",
    description:
      "On part ensemble découvrir les criques emblématiques de Tichy : eau claire, falaises et bonne humeur.",
    photoUrl: PLACEHOLDER_IMAGES.tichy,
    meetingPoint: "Front de mer, Béjaïa",
    includes: ["Guide local", "Snack sur la plage"],
    price: 2900,
    duration: "Demi-journée",
    capacity: 12,
    spotsTaken: 3,
    active: true,
    archived: false,
    departureDate: futureDate(12),
    listColumns: DEFAULT_LIST_COLUMNS,
    media: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "a1000000-0000-4000-8000-000000000002",
    slug: "week-end-decouverte",
    title: "Week-end découverte",
    description: "Deux jours entre mer et montagne avec nuit chez l'habitant.",
    photoUrl: PLACEHOLDER_IMAGES.gouraya,
    meetingPoint: "Gare routière de Béjaïa",
    includes: ["Hébergement", "Petits-déjeuners"],
    price: 12900,
    duration: "2 jours",
    capacity: 10,
    spotsTaken: 7,
    active: true,
    archived: false,
    departureDate: futureDate(21),
    media: [],
    listColumns: DEFAULT_LIST_COLUMNS,
    createdAt: new Date().toISOString(),
  },
  {
    id: "a1000000-0000-4000-8000-000000000003",
    slug: "gorges-kherrata",
    title: "Gorges de Kherrata",
    description: "Sentiers, ponts naturels et panoramas — une journée d'aventure en petit groupe.",
    photoUrl: PLACEHOLDER_IMAGES.kherrata,
    meetingPoint: "Entrée gorges — Kherrata",
    includes: ["Guide", "Collation", "Transport A/R"],
    price: 3500,
    duration: "Journée",
    capacity: 14,
    spotsTaken: 14,
    active: true,
    archived: false,
    departureDate: futureDate(7),
    media: [],
    listColumns: DEFAULT_LIST_COLUMNS,
    createdAt: new Date().toISOString(),
  },
  {
    id: "a1000000-0000-4000-8000-000000000004",
    slug: "corniche-coucher-soleil",
    title: "Corniche — Soirée coucher de soleil",
    description: "Balade sur la corniche, thé et coucher de soleil sur la Méditerranée.",
    photoUrl: PLACEHOLDER_IMAGES.corniche,
    meetingPoint: "Place du 1er Novembre, Béjaïa",
    includes: ["Guide", "Thé local"],
    price: 1800,
    duration: "Soirée",
    capacity: 16,
    spotsTaken: 2,
    active: true,
    archived: false,
    departureDate: futureDate(3),
    media: [],
    listColumns: DEFAULT_LIST_COLUMNS,
    createdAt: new Date().toISOString(),
  },
];
