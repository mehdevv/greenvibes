import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/auth";
import { canAccessOwnerAdmin, isWorkerAccount } from "@/lib/admin-permissions";
import { PortalSwitchLinks } from "@/components/admin/portal-switch-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { PortalProvider } from "@/lib/portal";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <PortalProvider portal="admin">
      <AdminLoginForm />
    </PortalProvider>
  );
}

function AdminLoginForm() {
  const { user, isLoading, signIn, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user && canAccessOwnerAdmin(user)) {
      navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = await signIn(email, password);
      if (!profile) {
        throw new Error("Profil administrateur introuvable");
      }
      if (isWorkerAccount(profile)) {
        await signOut();
        toast.error("Compte employé : utilisez l'espace employé.");
        navigate({ to: "/employe/login" });
        return;
      }
      if (!canAccessOwnerAdmin(profile)) {
        await signOut();
        toast.error("Aucune permission active sur ce compte.");
        return;
      }
      toast.success("Connexion réussie");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-secondary px-4 py-8">
      <Card className="my-auto w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Logo size="lg" className="justify-center" />
          </div>
          <CardTitle className="font-display text-2xl text-foreground">Connexion propriétaire</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Espace administration réservé au propriétaire et aux comptes gestionnaires.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
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
          <PortalSwitchLinks current="admin" />
        </CardContent>
      </Card>
    </div>
  );
}
