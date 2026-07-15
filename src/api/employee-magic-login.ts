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
      return invokeFunction<EmployeeMagicLinkResult>(
        "employee-magic-login",
        { action: "create", workerId },
        supabaseAdmin,
      );
    },
  });
}

export type RedeemEmployeeMagicLinkResult = {
  ok: true;
  action_link?: string;
  token_hash?: string;
  email: string;
  verification_type?: string;
};

export async function redeemEmployeeMagicLink(token: string): Promise<RedeemEmployeeMagicLinkResult> {
  const { supabaseEmployee } = await import("@/lib/supabase");
  const { data, error } = await supabaseEmployee.functions.invoke("employee-magic-login", {
    body: { action: "redeem", token },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(String(data.error));
  return data as RedeemEmployeeMagicLinkResult;
}
