import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminProfile } from "@/api/types";
import { mapAdminProfile } from "@/api/mappers";
import {
  canAccessEmployeePortal,
  canAccessOwnerAdmin,
  hasAdminPermission,
  hasAnyWritePermission,
  type AdminAction,
  type AdminResource,
} from "@/lib/admin-permissions";
import { usePortal } from "@/lib/portal";
import { isSupabaseConfigured, supabaseAdmin, supabaseEmployee } from "@/lib/supabase";

export interface AuthState {
  user: AdminProfile | null;
  isLoading: boolean;
  hasSession: boolean;
  canWrite: boolean;
  isSuperAdmin: boolean;
  can: (resource: AdminResource, action: AdminAction) => boolean;
  signIn: (email: string, password: string) => Promise<AdminProfile | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

function useAuthState(client: SupabaseClient): AuthState {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setHasSession(false);
      return null;
    }

    const { data: { user: authUser } } = await client.auth.getUser();
    if (!authUser) {
      setUser(null);
      setHasSession(false);
      return null;
    }

    setHasSession(true);

    const { data, error } = await client
      .from("admin_profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error || !data) {
      setUser(null);
      return null;
    }

    const profile = mapAdminProfile(data);
    setUser(profile);
    return profile;
  }, [client]);

  useEffect(() => {
    loadProfile().finally(() => setIsLoading(false));

    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [client, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase n'est pas configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
    }
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return loadProfile();
  }, [client, loadProfile]);

  const signOut = useCallback(async () => {
    await client.auth.signOut();
    setUser(null);
    setHasSession(false);
  }, [client]);

  const can = useCallback(
    (resource: AdminResource, action: AdminAction) => hasAdminPermission(user, resource, action),
    [user],
  );

  const canWrite = hasAnyWritePermission(user);
  const isSuperAdmin = user?.role === "super_admin";

  return useMemo(
    () => ({
      user,
      isLoading,
      hasSession,
      canWrite,
      isSuperAdmin,
      can,
      signIn,
      signOut,
      refresh: loadProfile,
    }),
    [user, isLoading, hasSession, canWrite, isSuperAdmin, can, signIn, signOut, loadProfile],
  );
}

const AdminAuthContext = createContext<AuthState | null>(null);
const EmployeeAuthContext = createContext<AuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const state = useAuthState(supabaseAdmin);
  return <AdminAuthContext.Provider value={state}>{children}</AdminAuthContext.Provider>;
}

export function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const state = useAuthState(supabaseEmployee);
  return <EmployeeAuthContext.Provider value={state}>{children}</EmployeeAuthContext.Provider>;
}

/** Backward-compatible root wrapper */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <EmployeeAuthProvider>{children}</EmployeeAuthProvider>
    </AdminAuthProvider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function useEmployeeAuth() {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) throw new Error("useEmployeeAuth must be used within EmployeeAuthProvider");
  return ctx;
}

export function useAuth() {
  const portal = usePortal();
  const admin = useContext(AdminAuthContext);
  const employee = useContext(EmployeeAuthContext);
  const ctx = portal === "employee" ? employee : admin;
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useCanAccessAdmin() {
  const { user, isLoading } = useAuth();
  return { allowed: canAccessOwnerAdmin(user), isLoading };
}

export { canAccessEmployeePortal, canAccessOwnerAdmin };
