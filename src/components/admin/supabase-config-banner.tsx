import { isSupabaseConfigured, supabaseConfigHint } from "@/lib/supabase";

export function SupabaseConfigBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-medium">Base de données non connectée</p>
      <p className="mt-1 text-amber-900/90">
        {supabaseConfigHint} En attendant, les listes s&apos;affichent vides — aucune erreur ne bloque l&apos;interface.
      </p>
    </div>
  );
}
