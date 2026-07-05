import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminProfile } from "./types";
import { mapAdminProfile } from "./mappers";
import { invokeFunction, supabase } from "@/lib/supabase";

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin-session"],
    queryFn: async (): Promise<AdminProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error || !data) return null;
      return mapAdminProfile(data);
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-session"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-session"] }),
  });
}

export function useIsAdminSetupComplete() {
  return useQuery({
    queryKey: ["admin-setup-complete"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_admin_setup_complete");
      if (error) return false;
      return Boolean(data);
    },
  });
}

export function useSetupAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string; fullName: string }) =>
      invokeFunction<{ ok: boolean }>("setup-admin", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-setup-complete"] });
      qc.invalidateQueries({ queryKey: ["admin-session"] });
    },
  });
}
