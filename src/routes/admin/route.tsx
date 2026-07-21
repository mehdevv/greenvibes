import { Link, Navigate, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  BookOpen,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeft,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { canAccessOwnerAdmin } from "@/lib/admin-permissions";
import { PortalProvider } from "@/lib/portal";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NatureTexture } from "@/components/motion";
import {
  PortalBottomNav,
  PortalMobileDrawerContent,
  type PortalNavItem,
} from "@/components/admin/portal-mobile-shell";
import { SupabaseConfigBanner } from "@/components/admin/supabase-config-banner";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (!isSupabaseConfigured) return;
    if (location.pathname === "/admin/login" || location.pathname === "/admin/setup") return;

    const { data: { session } } = await supabaseAdmin.auth.getSession();
    if (!session) {
      throw redirect({ to: "/admin/login" });
    }

    const { data: profile } = await supabaseAdmin
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile?.role === "worker") {
      throw redirect({ to: "/employe/login" });
    }
  },
  component: AdminLayoutRoot,
});

function AdminLayoutRoot() {
  return (
    <PortalProvider portal="admin">
      <AdminLayout />
    </PortalProvider>
  );
}

const navItems = [
  { to: "/admin/dashboard", label: "Tableau de bord", icon: LayoutDashboard, show: () => true },
  { to: "/admin/inscriptions", label: "Inscriptions", icon: UserPlus, show: (can) => can("reservations", "create") },
  { to: "/admin/reservations", label: "Réservations", icon: BookOpen, show: (can) => can("reservations", "read") },
  { to: "/admin/trips", label: "Voyages", icon: Package, show: (can) => can("trips", "read") },
  { to: "/admin/equipe", label: "Équipe", icon: Users, show: (_, isSuperAdmin) => isSuperAdmin },
] as const;

const SIDEBAR_COLLAPSED_KEY = "gv-admin-sidebar-collapsed";

function AdminLayout() {
  const { user, isLoading, hasSession, signOut, canWrite, can, isSuperAdmin } = useAuth();
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

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => item.show(can, isSuperAdmin)),
    [can, isSuperAdmin],
  );

  const mobileNavItems: PortalNavItem[] = useMemo(
    () => visibleNavItems.map(({ to, label, icon }) => ({ to, label, icon })),
    [visibleNavItems],
  );

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

  if (!canAccessOwnerAdmin(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
        <div className="max-w-md rounded-md border border-border bg-card p-8 text-center shadow-soft">
          <h1 className="font-display text-xl font-bold text-foreground">Accès limité</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {user.role === "worker"
              ? "Les comptes employés utilisent l'espace dédié /employe/login."
              : "Votre compte n'a aucune permission active. Contactez le propriétaire."}
          </p>
          {user.role === "worker" && (
            <Button asChild className="mt-4 rounded-full">
              <Link to="/employe/login" reloadDocument>Espace employé</Link>
            </Button>
          )}
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

  const NavLinks = ({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) => (
    <>
      {visibleNavItems.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const link = (
          <Link
            key={item.to}
            to={item.to}
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
    <div className="relative flex min-h-screen bg-secondary/40">
      <NatureTexture className="opacity-60" />
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-card transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen md:max-h-screen md:flex-col",
          sidebarCollapsed ? "w-[4.25rem]" : "w-52",
        )}
      >
        <div
          className={cn(
            "shrink-0 flex items-center border-b border-border py-4",
            sidebarCollapsed ? "justify-center px-2" : "gap-2 px-4",
          )}
        >
          <Logo size="sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="font-display text-sm font-bold text-foreground">GreenVibes</div>
              <div className="text-xs text-muted-foreground">Administration</div>
            </div>
          )}
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          <NavLinks collapsed={sidebarCollapsed} />
        </nav>
        <div className="mt-auto shrink-0 border-t border-border bg-card p-2">
          {!sidebarCollapsed && (
            <>
              <div className="mb-2 px-3 text-xs text-muted-foreground truncate">{user.fullName || user.email}</div>
              {!canWrite && (
                <div className="mb-2 px-3 text-xs text-orange-600">Lecture seule</div>
              )}
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
                    navigate({ to: "/admin/login" });
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
                navigate({ to: "/admin/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
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
                  subtitle="Administration"
                  items={mobileNavItems}
                  pathname={pathname}
                  userLabel={user.fullName || user.email}
                  readOnly={!canWrite}
                  onNavigate={() => setMobileOpen(false)}
                  onSignOut={async () => {
                    setMobileOpen(false);
                    await signOut();
                    navigate({ to: "/admin/login" });
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
                "Admin"}
            </div>
          </div>
          <Link to="/" className="shrink-0 text-xs text-muted-foreground hover:text-foreground">
            Voir le site
          </Link>
        </header>
        <main className="relative z-10 mx-auto w-full max-w-[1800px] flex-1 p-3 pb-24 md:p-6 md:pb-8 lg:p-8">
          <div className="mb-4">
            <SupabaseConfigBanner />
          </div>
          <Outlet />
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
