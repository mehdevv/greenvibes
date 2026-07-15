import { createFileRoute, Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { BookOpen, LogOut, Menu, Package, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NatureTexture } from "@/components/motion";
import { canAccessEmployeePortal } from "@/lib/admin-permissions";
import { useAuth } from "@/lib/auth";
import { PortalProvider } from "@/lib/portal";
import { supabaseEmployee } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employe")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/employe/login") return;

    const { data: { session } } = await supabaseEmployee.auth.getSession();
    if (!session) {
      throw redirect({ to: "/employe/login" });
    }
  },
  component: EmployeeLayoutRoot,
});

const navItems = [
  { to: "/employe/inscriptions", label: "Inscriptions", icon: UserPlus, show: (can) => can("reservations", "create") },
  { to: "/employe/reservations", label: "Réservations", icon: BookOpen, show: (can) => can("reservations", "read") },
  { to: "/employe/trips", label: "Voyages", icon: Package, show: (can) => can("trips", "read") },
] as const;

function EmployeeLayoutRoot() {
  return (
    <PortalProvider portal="employee">
      <EmployeeLayout />
    </PortalProvider>
  );
}

function EmployeeLayout() {
  const { user, isLoading, hasSession, signOut, can, canWrite } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNavItems = useMemo(() => navItems.filter((item) => item.show(can)), [can]);

  if (pathname === "/employe/login") {
    return <Outlet />;
  }

  if (pathname === "/employe" || pathname === "/employe/") {
    const first = visibleNavItems[0]?.to ?? "/employe/login";
    return <Navigate to={first} replace />;
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
            <h1 className="font-display text-xl font-bold text-foreground">Compte non reconnu</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Ce compte n&apos;est pas configuré comme employé. Utilisez l&apos;espace administrateur propriétaire.
            </p>
            <Button
              className="mt-6 rounded-full"
              variant="outline"
              onClick={async () => {
                await signOut();
                navigate({ to: "/employe/login" });
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      );
    }
    return <Navigate to="/employe/login" />;
  }

  if (!canAccessEmployeePortal(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
        <div className="max-w-md rounded-md border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="font-display text-xl font-bold text-foreground">Espace réservé aux employés</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {user.role === "worker"
              ? "Votre compte n'a aucune permission active. Contactez le propriétaire."
              : "Les comptes propriétaire se connectent sur l'espace admin."}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            {user.role !== "worker" && (
              <Button asChild variant="default" className="rounded-full">
                <Link to="/admin/login">Aller à l&apos;admin</Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="rounded-full"
              onClick={async () => {
                await signOut();
                navigate({ to: "/employe/login" });
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {visibleNavItems.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="relative flex min-h-screen bg-secondary/40">
      <NatureTexture className="opacity-60" />
      <aside className="hidden w-52 shrink-0 border-r border-border bg-card md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Logo size="sm" />
          <div className="min-w-0">
            <div className="font-display text-sm font-bold text-foreground">GreenVibes</div>
            <div className="text-xs text-muted-foreground">Espace employé</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          <NavLinks />
        </nav>
        <div className="mt-auto border-t border-border p-2">
          <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{user.fullName || user.email}</div>
          {!canWrite && <div className="mb-2 px-3 text-xs text-orange-600">Lecture seule</div>}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={async () => {
              await signOut();
              navigate({ to: "/employe/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-3">
                <div className="mb-4 px-2">
                  <div className="font-display text-sm font-bold">Espace employé</div>
                </div>
                <nav className="space-y-1">
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <div className="truncate font-display text-sm font-semibold text-foreground md:text-base">
              {visibleNavItems.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))?.label ??
                "Employé"}
            </div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Voir le site
          </Link>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-[1800px] flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
