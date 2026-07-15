import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { redeemEmployeeMagicLink } from "@/api/employee-magic-login";
import { Logo } from "@/components/brand/logo";
import { PortalSwitchLinks } from "@/components/admin/portal-switch-links";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmployeeAuth } from "@/lib/auth";
import { PortalProvider } from "@/lib/portal";
import { supabaseEmployee } from "@/lib/supabase";

export const Route = createFileRoute("/employe/entree/$token")({
  component: EmployeeMagicEntryPage,
});

function EmployeeMagicEntryPage() {
  return (
    <PortalProvider portal="employee">
      <EmployeeMagicEntryForm />
    </PortalProvider>
  );
}

function EmployeeMagicEntryForm() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { refresh } = useEmployeeAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const result = await redeemEmployeeMagicLink(token);

        if (result.action_link) {
          window.location.replace(result.action_link);
          return;
        }

        if (!result.token_hash) {
          throw new Error("Connexion impossible");
        }

        const otpType =
          result.verification_type === "magiclink" ? "magiclink" : "email";

        let verifyError = (
          await supabaseEmployee.auth.verifyOtp({
            type: otpType,
            token_hash: result.token_hash,
            email: result.email,
          })
        ).error;

        if (verifyError && otpType === "magiclink") {
          verifyError = (
            await supabaseEmployee.auth.verifyOtp({
              type: "email",
              token_hash: result.token_hash,
              email: result.email,
            })
          ).error;
        }

        if (verifyError) throw verifyError;

        await refresh();

        if (!cancelled) {
          navigate({ to: "/employe/inscriptions", replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Connexion impossible");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, refresh]);

  if (loading && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
        <Card className="w-full max-w-md border-forest/20">
          <CardHeader className="text-center">
            <Logo size="lg" className="mx-auto mb-2 justify-center" />
            <CardTitle className="font-display text-xl">Connexion en cours…</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Vérification du lien sécurisé employé.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl text-destructive">Lien invalide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground">
            Demandez un nouveau lien ou QR code au propriétaire (page Équipe).
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/employe/login">Connexion classique</Link>
          </Button>
          <PortalSwitchLinks current="employee" />
        </CardContent>
      </Card>
    </div>
  );
}
