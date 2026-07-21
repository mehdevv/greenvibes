import { useMutation } from "@tanstack/react-query";
import { invokeFunction, supabaseAdmin } from "@/lib/supabase";

export type EmployeeMagicLinkResult = {
  ok: true;
  loginUrl: string;
  expiresAt: string;
  workerName: string;
};

export function useCreateEmployeeMagicLink() {
  return useMutation({
    mutationFn: async (workerId: string): Promise<EmployeeMagicLinkResult> => {
      const siteOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
      return invokeFunction<EmployeeMagicLinkResult>(
        "employee-magic-login",
        { action: "create", workerId, siteOrigin },
        supabaseAdmin,
      );
    },
  });
}

export type RedeemEmployeeMagicLinkResult = {
  ok: true;
  token_hash: string;
  email: string;
  verification_type?: string;
};

export async function redeemEmployeeMagicLink(token: string): Promise<RedeemEmployeeMagicLinkResult> {
  const { supabaseEmployee } = await import("@/lib/supabase");
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
  const { data, error } = await supabaseEmployee.functions.invoke("employee-magic-login", {
    body: { action: "redeem", token, siteOrigin },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
  return data as RedeemEmployeeMagicLinkResult;
}
