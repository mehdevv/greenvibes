import type {
  AdminProfile,
  BlogPost,
  Booking,
  Client,
  ContactMessage,
  Destination,
  GalleryItem,
  Offer,
  OfferImage,
  TripSession,
} from "./types";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export function mapAdminProfile(row: Record<string, unknown>): AdminProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    fullName: String(row.full_name ?? ""),
    role: row.role as AdminProfile["role"],
    createdAt: String(row.created_at),
  };
}

export function mapDestination(row: Record<string, unknown>): Destination {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    tag: String(row.tag),
    description: String(row.description ?? ""),
    coverImage: row.cover_image ? String(row.cover_image) : null,
    latitude: row.latitude != null ? toNumber(row.latitude) : null,
    longitude: row.longitude != null ? toNumber(row.longitude) : null,
    isPublished: Boolean(row.is_published),
    sortOrder: toNumber(row.sort_order),
    createdAt: String(row.created_at),
  };
}

export function mapOffer(
  row: Record<string, unknown>,
  destination?: Record<string, unknown> | null,
): Offer {
  const destRow =
    destination ??
    (row.destinations as Record<string, unknown> | null) ??
    (row.destination as Record<string, unknown> | null);

  return {
    id: String(row.id),
    destinationId: row.destination_id ? String(row.destination_id) : null,
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    priceDzd: toNumber(row.price_dzd),
    durationLabel: String(row.duration_label ?? ""),
    offerType: row.offer_type as Offer["offerType"],
    features: Array.isArray(row.features) ? row.features.map(String) : [],
    coverImage: row.cover_image ? String(row.cover_image) : null,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    sortOrder: toNumber(row.sort_order),
    createdAt: String(row.created_at),
    destination: destRow ? mapDestination(destRow) : null,
  };
}

export function mapOfferImage(row: Record<string, unknown>): OfferImage {
  return {
    id: String(row.id),
    offerId: String(row.offer_id),
    storagePath: String(row.storage_path),
    sortOrder: toNumber(row.sort_order),
  };
}

export function mapTripSession(
  row: Record<string, unknown>,
  offer?: Record<string, unknown> | null,
): TripSession {
  const offerRow =
    offer ??
    (row.offers as Record<string, unknown> | null) ??
    (row.offer as Record<string, unknown> | null);
  const capacity = toNumber(row.capacity);
  const bookedCount = toNumber(row.booked_count);

  return {
    id: String(row.id),
    offerId: String(row.offer_id),
    sessionDate: String(row.session_date),
    capacity,
    bookedCount,
    status: row.status as TripSession["status"],
    createdAt: String(row.created_at),
    remainingSeats: Math.max(0, capacity - bookedCount),
    offer: offerRow ? mapOffer(offerRow) : null,
  };
}

export function mapClient(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    phone: String(row.phone),
    notes: row.notes ? String(row.notes) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    createdAt: String(row.created_at),
  };
}

export function mapBooking(
  row: Record<string, unknown>,
  session?: Record<string, unknown> | null,
  client?: Record<string, unknown> | null,
): Booking {
  const sessionRow =
    session ??
    (row.trip_sessions as Record<string, unknown> | null) ??
    (row.session as Record<string, unknown> | null);
  const clientRow =
    client ??
    (row.clients as Record<string, unknown> | null) ??
    (row.client as Record<string, unknown> | null);

  return {
    id: String(row.id),
    bookingRef: String(row.booking_ref),
    sessionId: String(row.session_id),
    clientId: row.client_id ? String(row.client_id) : null,
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    phone: String(row.phone),
    participants: toNumber(row.participants),
    status: row.status as Booking["status"],
    specialRequests: row.special_requests ? String(row.special_requests) : null,
    totalPriceDzd: toNumber(row.total_price_dzd),
    createdAt: String(row.created_at),
    session: sessionRow ? mapTripSession(sessionRow) : null,
    client: clientRow ? mapClient(clientRow) : null,
  };
}

export function mapBlogPost(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    body: String(row.body ?? ""),
    coverImage: row.cover_image ? String(row.cover_image) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    createdAt: String(row.created_at),
  };
}

export function mapGalleryItem(row: Record<string, unknown>): GalleryItem {
  return {
    id: String(row.id),
    title: String(row.title),
    storagePath: String(row.storage_path),
    destinationId: row.destination_id ? String(row.destination_id) : null,
    sortOrder: toNumber(row.sort_order),
    createdAt: String(row.created_at),
  };
}

export function mapContactMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    subject: String(row.subject),
    message: String(row.message),
    isRead: Boolean(row.is_read),
    createdAt: String(row.created_at),
  };
}

export function snakeCaseKeys<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snake] = value;
  }
  return out;
}
