import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { HomeEditBanner } from "@/components/admin/home-edit-banner";
import { FloatingActions } from "@/components/public/floating-actions";
import { PublicNav } from "@/components/public/public-nav";
import { SiteFooter } from "@/components/public/site-footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });

  return (
    <div className="relative min-h-screen bg-white">
      <PublicNav />
      {isHome && <HomeEditBanner />}
      <main>{children}</main>
      <SiteFooter />
      <FloatingActions />
    </div>
  );
}
