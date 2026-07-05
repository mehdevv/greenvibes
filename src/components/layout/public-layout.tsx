import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";
import { PageEnter } from "@/components/motion";

export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="relative z-10 flex-1 overflow-x-clip">
        <AnimatePresence mode="wait">
          <PageEnter key={pathname}>{children}</PageEnter>
        </AnimatePresence>
      </main>
      <PublicFooter />
    </div>
  );
}
