import { Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  BookOpen,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NatureTexture } from "@/components/motion";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login" || location.pathname === "/admin/setup") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminLayout,
});

const navItems = [
  { to: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/reservations", label: "Réservations", icon: BookOpen },
  { to: "/admin/trips", label: "Voyages", icon: Package },
] as const;

function AdminLayout() {
  const { user, isLoading, hasSession, signOut, canWrite } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/setup";

  if (isAuthPage) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    if (hasSession) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
          <div className="max-w-md rounded-md border border-border bg-card p-8 text-center shadow-soft">
            <h1 className="font-display text-xl font-bold text-foreground">Accès refusé</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Votre compte est connecté mais aucun profil administrateur n&apos;est associé.
              Créez le premier admin via la page de connexion ou contactez un super admin.
            </p>
            <Button
              className="mt-6 rounded-full"
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate({ to: "/admin/login" });
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      );
    }

    return <Navigate to="/admin/login" />;
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            pathname.startsWith(item.to)
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </>
  );

  return (
    <div className="relative flex min-h-screen bg-secondary/40">
      <NatureTexture className="opacity-60" />
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-5 py-5">
          <Logo size="sm" />
          <div>
            <div className="font-display text-sm font-bold text-foreground">GreenVibes</div>
            <div className="text-xs text-muted-foreground">Administration</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavLinks />
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-3 text-xs text-muted-foreground">{user.fullName || user.email}</div>
          {!canWrite && (
            <div className="mb-2 px-3 text-xs text-orange-600">Lecture seule</div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={async () => {
              await signOut();
              navigate({ to: "/admin/login" });
            }}
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-3">
              <nav className="mt-8 space-y-1">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="font-display text-sm font-semibold text-foreground md:text-base">
            {navItems.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))?.label ??
              "Admin"}
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Voir le site
          </Link>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
