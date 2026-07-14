import type { ReactNode } from "react";
import { FloatingActions } from "@/components/public/floating-actions";
import { PublicNav } from "@/components/public/public-nav";
import { SiteFooter } from "@/components/public/site-footer";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white">
      <PublicNav />
      <main>{children}</main>
      <SiteFooter />
      <FloatingActions />
    </div>
  );
}
