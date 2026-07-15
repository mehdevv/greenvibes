import { createContext, useContext, type ReactNode } from "react";

export type Portal = "admin" | "employee";

const PortalContext = createContext<Portal | null>(null);

export function PortalProvider({ portal, children }: { portal: Portal; children: ReactNode }) {
  return <PortalContext.Provider value={portal}>{children}</PortalContext.Provider>;
}

export function usePortal(): Portal {
  const ctx = useContext(PortalContext);
  if (ctx) return ctx;
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/employe")) {
    return "employee";
  }
  return "admin";
}
