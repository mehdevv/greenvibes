import { usePortal } from "@/lib/portal";

export type WorkspacePaths = {
  base: "/admin" | "/employe";
  login: "/admin/login" | "/employe/login";
  dashboard: "/admin/dashboard" | "/employe";
  inscriptions: "/admin/inscriptions" | "/employe/inscriptions";
  reservations: "/admin/reservations" | "/employe/reservations";
  trips: "/admin/trips" | "/employe/trips";
  tripDetail: "/admin/trips/$tripId" | "/employe/trips/$tripId";
};

const ADMIN_PATHS: WorkspacePaths = {
  base: "/admin",
  login: "/admin/login",
  dashboard: "/admin/dashboard",
  inscriptions: "/admin/inscriptions",
  reservations: "/admin/reservations",
  trips: "/admin/trips",
  tripDetail: "/admin/trips/$tripId",
};

const EMPLOYEE_PATHS: WorkspacePaths = {
  base: "/employe",
  login: "/employe/login",
  dashboard: "/employe",
  inscriptions: "/employe/inscriptions",
  reservations: "/employe/reservations",
  trips: "/employe/trips",
  tripDetail: "/employe/trips/$tripId",
};

export function useWorkspacePaths(): WorkspacePaths {
  const portal = usePortal();
  return portal === "employee" ? EMPLOYEE_PATHS : ADMIN_PATHS;
}
