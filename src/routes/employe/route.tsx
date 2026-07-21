import { createFileRoute, Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { BookOpen, LogOut, Menu, Package, PanelLeft, PanelLeftClose, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { AdminOutletTransition } from "@/components/admin/admin-outlet-transition";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NatureTexture } from "@/components/motion";
import {
  PortalBottomNav,
  PortalMobileDrawerContent,
  type PortalNavItem,
} from "@/components/admin/portal-mobile-shell";
import { canAccessEmployeePortal } from "@/lib/admin-permissions";
import { useAuth } from "@/lib/auth";
import { PortalProvider } from "@/lib/portal";
import { isSupabaseConfigured, supabaseEmployee } from "@/lib/supabase";
import { cn } from "@/lib/utils";

async function ensureEmployeeSession() {
  const { data: { session } } = await supabaseEmployee.auth.getSession();
  if (session) return session;

  if (typeof window === "undefined") return null;

  const hasAuthCallback =
    window.location.hash.includes("access_token=") ||
    window.location.search.includes("code=");

  if (!hasAuthCallback) return null;

  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 5000);
    const { data: { subscription } } = supabaseEmployee.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        resolve();
      }
    });
  });

  return (await supabaseEmployee.auth.getSession()).data.session;
}

export const Route = createFileRoute("/employe")({
  beforeLoad: async ({ location }) => {
    if (!isSupabaseConfigured) return;
    if (location.pathname === "/employe/login") return;
    if (location.pathname.startsWith("/employe/entree/")) return;

    const session = await ensureEmployeeSession();
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

const SIDEBAR_COLLAPSED_KEY = "gv-employee-sidebar-collapsed";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  const visibleNavItems = useMemo(() => navItems.filter((item) => item.show(can)), [can]);

  const mobileNavItems: PortalNavItem[] = useMemo(
    () => visibleNavItems.map(({ to, label, icon }) => ({ to, label, icon })),
    [visibleNavItems],
  );

  if (pathname === "/employe/login" || pathname.startsWith("/employe/entree/")) {
    return <AdminOutletTransition />;
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
                <Link to="/admin/login" reloadDocument>Aller à l&apos;admin</Link>
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

  const NavLinks = ({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) => (
    <>
      {visibleNavItems.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const link = (
          <Link
            key={item.to}
            to={item.to}
            preload="intent"
            onClick={onNavigate}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium transition",
              collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }

        return link;
      })}
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
    <div className="relative flex min-h-dvh bg-secondary/40 md:h-dvh md:max-h-dvh md:overflow-hidden">
      <NatureTexture className="opacity-60" />
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-card transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen md:max-h-screen md:flex-col",
          sidebarCollapsed ? "w-[4.25rem]" : "w-52",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-border py-4",
            sidebarCollapsed ? "justify-center px-2" : "gap-2 px-4",
          )}
        >
          <Logo size="sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="font-display text-sm font-bold text-foreground">GreenVibes</div>
              <div className="text-xs text-muted-foreground">Espace employé</div>
            </div>
          )}
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          <NavLinks collapsed={sidebarCollapsed} />
        </nav>
        <div className="mt-auto shrink-0 border-t border-border bg-card p-2">
          {!sidebarCollapsed && (
            <>
              <div className="mb-2 truncate px-3 text-xs text-muted-foreground">{user.fullName || user.email}</div>
              {!canWrite && <div className="mb-2 px-3 text-xs text-orange-600">Lecture seule</div>}
            </>
          )}
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full"
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/employe/login" });
                  }}
                  aria-label="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Déconnexion</TooltipContent>
            </Tooltip>
          ) : (
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
          )}
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:h-dvh md:max-h-dvh">
        <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-4">
                <PortalMobileDrawerContent
                  title="GreenVibes"
                  subtitle="Espace employé"
                  items={mobileNavItems}
                  pathname={pathname}
                  userLabel={user.fullName || user.email}
                  readOnly={!canWrite}
                  onNavigate={() => setMobileOpen(false)}
                  onSignOut={async () => {
                    setMobileOpen(false);
                    await signOut();
                    navigate({ to: "/employe/login" });
                  }}
                />
              </SheetContent>
            </Sheet>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="hidden h-9 w-9 shrink-0 md:inline-flex"
                  onClick={() => setSidebarCollapsed((c) => !c)}
                  aria-label={sidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
                >
                  {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {sidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
              </TooltipContent>
            </Tooltip>
            <div className="truncate font-display text-sm font-semibold text-foreground md:text-base">
              {visibleNavItems.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))?.label ??
                "Employé"}
            </div>
          </div>
          <Link to="/" className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
            Voir le site
          </Link>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-[1800px] flex-1 overflow-y-auto overscroll-contain p-3 pb-24 md:p-6 md:pb-8 lg:p-8">
          <AdminOutletTransition />
        </main>
      </div>

      <PortalBottomNav
        items={mobileNavItems}
        pathname={pathname}
        onMore={() => setMobileOpen(true)}
      />
    </div>
    </TooltipProvider>
  );
}
