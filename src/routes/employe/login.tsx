import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmployeeAuth } from "@/lib/auth";
import { canAccessEmployeePortal } from "@/lib/admin-permissions";
import { PortalSwitchLinks } from "@/components/admin/portal-switch-links";
import { PortalProvider } from "@/lib/portal";
import { toast } from "sonner";

export const Route = createFileRoute("/employe/login")({
  component: EmployeeLoginPage,
});

function EmployeeLoginPage() {
  return (
    <PortalProvider portal="employee">
      <EmployeeLoginForm />
    </PortalProvider>
  );
}

function EmployeeLoginForm() {
  const { user, isLoading, signIn, signOut } = useEmployeeAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user && canAccessEmployeePortal(user)) {
      navigate({ to: "/employe/inscriptions", replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (!profile) {
        throw new Error("Profil employé introuvable");
      }
      if (!canAccessEmployeePortal(profile)) {
        await signOut();
        if (profile.role !== "worker") {
          toast.error("Ce compte est un compte propriétaire. Utilisez l'espace admin.");
        } else {
          toast.error("Aucune permission active sur ce compte.");
        }
        return;
      }
      toast.success("Connexion réussie");
      navigate({ to: "/employe/inscriptions" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-secondary px-4 py-8">
      <Card className="my-auto w-full max-w-md border-forest/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Logo size="lg" className="justify-center" />
          </div>
          <CardTitle className="font-display text-2xl text-foreground">Espace employé</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Connexion dédiée aux comptes employés. Indépendante de l&apos;espace propriétaire.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="employee-email">Email</Label>
              <Input
                id="employee-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="employee-password">Mot de passe</Label>
              <Input
                id="employee-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
          <PortalSwitchLinks current="employee" />
        </CardContent>
      </Card>
    </div>
  );
}
