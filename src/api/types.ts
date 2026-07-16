export type AdminRole = "super_admin" | "manager" | "commercial" | "reader" | "worker";

export type AdminResourcePermissions = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type AdminPermissions = {
  trips: AdminResourcePermissions;
  reservations: AdminResourcePermissions;
  tripLists: AdminResourcePermissions;
};

export type OfferType = "mer" | "montagne" | "culture" | "aventure";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "completed";

export type SessionStatus = "open" | "full" | "cancelled";

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  permissions: AdminPermissions;
  createdAt: string;
}

export interface Destination {
  id: string;
  slug: string;
  title: string;
  tag: string;
  description: string;
  coverImage: string | null;
  latitude: number | null;
  longitude: number | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  destinationId: string | null;
  slug: string;
  title: string;
  description: string;
  priceDzd: number;
  durationLabel: string;
  offerType: OfferType;
  features: string[];
  coverImage: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  destination?: Destination | null;
}

export interface OfferImage {
  id: string;
  offerId: string;
  storagePath: string;
  sortOrder: number;
}

export interface TripSession {
  id: string;
  offerId: string;
  sessionDate: string;
  capacity: number;
  bookedCount: number;
  status: SessionStatus;
  createdAt: string;
  offer?: Offer | null;
  remainingSeats?: number;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  sessionId: string;
  clientId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  participants: number;
  status: BookingStatus;
  specialRequests: string | null;
  totalPriceDzd: number;
  createdAt: string;
  session?: TripSession | null;
  client?: Client | null;
}

export interface UpdateBookingInput {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  participants: number;
  status: BookingStatus;
  specialRequests?: string | null;
  sessionId?: string;
  totalPriceDzd?: number;
}

export interface UpdateClientInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  storagePath: string;
  destinationId: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsOverview {
  bookingsToday: number;
  bookingsThisMonth: number;
  revenueThisMonth: number;
  totalClients: number;
  activeOffers: number;
  fillRatePercent: number;
  bookingsTrend: { date: string; count: number }[];
  topOffers: { title: string; bookings: number }[];
  recentBookings: Reservation[];
}

export interface CreateBookingInput {
  sessionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  participants: number;
  specialRequests?: string;
}

export interface CreateBookingResult {
  bookingId: string;
  bookingRef: string;
  status: BookingStatus;
  totalPriceDzd: number;
}

/** v2 — simplified trip model (cahier des charges) */
export type ReservationStatus = "confirmed" | "waitlisted" | "cancelled";

export type TripMediaType = "image" | "video";

export interface TripMedia {
  id: string;
  tripId: string;
  url: string;
  mediaType: TripMediaType;
  sortOrder: number;
}

export interface Trip {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  photoUrl: string | null;
  meetingPoint: string;
  includes: string[];
  price: number;
  duration: string;
  capacity: number;
  spotsTaken: number;
  active: boolean;
  archived: boolean;
  departureDate: string | null;
  listColumns: TripSheetColumn[];
  media: TripMedia[];
  createdAt: string;
}

export interface Reservation {
  id: string;
  tripId: string;
  bookingRef: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  status: ReservationStatus;
  sortOrder: number;
  createdAt: string;
  trip?: Trip | null;
}

export interface UpdateReservationInput {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  sortOrder?: number;
}

export interface TripSheetColumn {
  id: string;
  label: string;
}

export interface TripSheet {
  id: string;
  tripId: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TripSheetRow {
  id: string;
  sheetId: string;
  sortOrder: number;
  cells: Record<string, string>;
  reservationId: string | null;
  createdAt: string;
}

export interface CreateTripSheetInput {
  tripId: string;
  name: string;
}

export interface UpdateTripSheetInput {
  id: string;
  name?: string;
  sortOrder?: number;
}

export interface CreateReservationInput {
  tripId: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
}

export interface CreateReservationResult {
  reservationId: string;
  bookingRef: string;
  status: ReservationStatus;
  spotsRemaining: number;
}
