import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { getPortalLoginPath, PORTAL_LOGIN_META, type LoginPortal } from "@/lib/portal-login-urls";
import { cn } from "@/lib/utils";

type PortalSwitchLinksProps = {
  current: LoginPortal;
};

export function PortalSwitchLinks({ current }: PortalSwitchLinksProps) {
  const other: LoginPortal = current === "admin" ? "employee" : "admin";
  const path = getPortalLoginPath(other);
  const label = other === "admin" ? "Espace admin" : "Espace employé";

  return (
    <div className="mt-6 space-y-3 border-t border-border pt-6 text-center text-sm">
      <p className="text-muted-foreground">
        {current === "admin" ? "Employé ?" : "Propriétaire / gestionnaire ?"}
      </p>
      <Link
        to={path}
        reloadDocument
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-11 w-full rounded-full font-medium text-forest",
        )}
      >
        {label}
      </Link>
      <p className="text-xs text-muted-foreground">{PORTAL_LOGIN_META[other].description}</p>
      <Link
        to="/"
        className="inline-block py-1 text-muted-foreground transition hover:text-foreground"
      >
        Retour au site
      </Link>
    </div>
  );
}
