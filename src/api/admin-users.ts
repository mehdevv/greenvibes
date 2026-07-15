import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminPermissions } from "./types";
import { mapAdminProfile } from "./mappers";
import { invokeFunction, supabaseAdmin } from "@/lib/supabase";

export type AdminTeamMember = ReturnType<typeof mapAdminProfile>;

export function useListAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<AdminTeamMember[]> => {
      const { data, error } = await supabaseAdmin
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => mapAdminProfile(row));
    },
  });
}

type CreateAdminUserInput = {
  email: string;
  password: string;
  fullName: string;
  permissions: AdminPermissions;
};

type UpdateAdminUserInput = {
  id: string;
  fullName?: string;
  permissions?: AdminPermissions;
  password?: string;
};

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAdminUserInput) => {
      return invokeFunction<{ ok: true; id: string }>("manage-admin-user", {
        action: "create",
        ...input,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAdminUserInput) => {
      return invokeFunction<{ ok: true }>("manage-admin-user", {
        action: "update",
        ...input,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return invokeFunction<{ ok: true }>("manage-admin-user", {
        action: "delete",
        id,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
