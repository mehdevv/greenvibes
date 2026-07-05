import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useIsAdminSetupComplete, useSetupAdmin } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { data: setupComplete, isLoading: setupLoading } = useIsAdminSetupComplete();
  const setupAdmin = useSetupAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Connexion réussie");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setupAdmin.mutateAsync({ email, password, fullName });
      await signIn(email, password);
      toast.success("Compte administrateur créé");
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Configuration échouée");
    }
  };

  if (setupLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const showSetup = !setupComplete || isSetup;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3">
            <Logo size="lg" className="justify-center" />
          </div>
          <CardTitle className="font-display text-2xl text-foreground">
            {showSetup ? "Configuration admin" : "Connexion admin"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSetup ? (
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <Button type="submit" className="w-full" disabled={setupAdmin.isPending}>
                Créer le compte admin
              </Button>
              {setupComplete && (
                <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsSetup(false)}>
                  Déjà un compte ? Se connecter
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Se connecter
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Retour au site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
