import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminProfile } from "@/api/types";
import { mapAdminProfile } from "@/api/mappers";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: AdminProfile | null;
  isLoading: boolean;
  hasSession: boolean;
  canWrite: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminProfile | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setHasSession(false);
      return;
    }

    setHasSession(true);

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error || !data) {
      setUser(null);
      return;
    }

    setUser(mapAdminProfile(data));
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setIsLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await loadProfile();
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHasSession(false);
  }, []);

  const canWrite = user?.role !== "reader";

  const value = useMemo(
    () => ({
      user,
      isLoading,
      hasSession,
      canWrite,
      signIn,
      signOut,
      refresh: loadProfile,
    }),
    [user, isLoading, hasSession, canWrite, signIn, signOut, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
