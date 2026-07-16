import type { AdminPermissions, AdminProfile, AdminRole } from "@/api/types";

export type AdminResource = keyof AdminPermissions;
export type AdminAction = "read" | "create" | "update" | "delete";

export const ADMIN_RESOURCES: { id: AdminResource; label: string }[] = [
  { id: "trips", label: "Offres / voyages" },
  { id: "reservations", label: "Réservations" },
  { id: "tripLists", label: "Listes / feuilles" },
];

export const ADMIN_ACTIONS: { id: AdminAction; label: string }[] = [
  { id: "read", label: "Voir" },
  { id: "create", label: "Ajouter" },
  { id: "update", label: "Modifier" },
  { id: "delete", label: "Supprimer" },
];

export function emptyPermissions(): AdminPermissions {
  return {
    trips: { read: false, create: false, update: false, delete: false },
    reservations: { read: false, create: false, update: false, delete: false },
    tripLists: { read: false, create: false, update: false, delete: false },
  };
}

export function fullPermissions(): AdminPermissions {
  return {
    trips: { read: true, create: true, update: true, delete: true },
    reservations: { read: true, create: true, update: true, delete: true },
    tripLists: { read: true, create: true, update: true, delete: true },
  };
}

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  super_admin: fullPermissions(),
  manager: fullPermissions(),
  commercial: {
    trips: { read: true, create: false, update: false, delete: false },
    reservations: { read: true, create: true, update: true, delete: false },
    tripLists: { read: true, create: false, update: false, delete: false },
  },
  reader: {
    trips: { read: true, create: false, update: false, delete: false },
    reservations: { read: true, create: false, update: false, delete: false },
    tripLists: { read: true, create: false, update: false, delete: false },
  },
  worker: emptyPermissions(),
};

export const DEFAULT_WORKER_PERMISSIONS: AdminPermissions = {
  trips: { read: true, create: false, update: false, delete: false },
  reservations: { read: true, create: true, update: true, delete: false },
  tripLists: { read: true, create: false, update: false, delete: false },
};

export function normalizePermissions(
  input: Partial<AdminPermissions> | null | undefined,
  role: AdminRole,
): AdminPermissions {
  const base = { ...ROLE_DEFAULT_PERMISSIONS[role] };
  if (!input) return base;

  for (const resource of ADMIN_RESOURCES) {
    const r = resource.id;
    const incoming = input[r];
    if (!incoming) continue;
    base[r] = {
      read: Boolean(incoming.read),
      create: Boolean(incoming.create),
      update: Boolean(incoming.update),
      delete: Boolean(incoming.delete),
    };
  }
  return base;
}

export function hasAdminPermission(
  user: AdminProfile | null,
  resource: AdminResource,
  action: AdminAction,
): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;

  const perms = normalizePermissions(user.permissions, user.role);
  return Boolean(perms[resource]?.[action]);
}

export function hasAnyWritePermission(user: AdminProfile | null): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;

  for (const resource of ADMIN_RESOURCES) {
    for (const action of ["create", "update", "delete"] as const) {
      if (hasAdminPermission(user, resource.id, action)) return true;
    }
  }
  return false;
}

export function isWorkerAccount(user: AdminProfile | null): boolean {
  return user?.role === "worker";
}

export function canAccessAdmin(user: AdminProfile | null): boolean {
  if (!user) return false;
  for (const resource of ADMIN_RESOURCES) {
    if (hasAdminPermission(user, resource.id, "read")) return true;
  }
  return user.role === "super_admin";
}

/** Owner portal — workers use /employe instead */
export function canAccessOwnerAdmin(user: AdminProfile | null): boolean {
  if (!user || isWorkerAccount(user)) return false;
  return canAccessAdmin(user);
}

export function canAccessEmployeePortal(user: AdminProfile | null): boolean {
  if (!user || !isWorkerAccount(user)) return false;
  return canAccessAdmin(user);
}
