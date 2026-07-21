import QRCode from "react-qr-code";
import { Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPortalLoginUrl,
  PORTAL_LOGIN_META,
  type LoginPortal,
} from "@/lib/portal-login-urls";
import { cn } from "@/lib/utils";

function LoginQrCard({ portal }: { portal: LoginPortal }) {
  const url = getPortalLoginUrl(portal);
  const meta = PORTAL_LOGIN_META[portal];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden",
        portal === "admin" ? "border-forest/20" : "border-sky-200/80",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="h-4 w-4 text-forest" />
          {meta.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            "shrink-0 rounded-xl border bg-white p-3 shadow-sm",
            portal === "employee" && "ring-1 ring-sky-100",
          )}
          aria-hidden
        >
          <QRCode
            value={url}
            size={148}
            level="M"
            bgColor="#ffffff"
            fgColor="#1b4332"
            title={`QR code — ${meta.title}`}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            Scannez avec l&apos;appareil photo du téléphone pour ouvrir la page de connexion.
          </p>
          <code className="block break-all rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
            {url}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5" />
              Copier
            </Button>
            <a
              href={url}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PortalLoginQrSection({ embedded }: { embedded?: boolean } = {}) {
  return (
    <section className={embedded ? "space-y-4" : "space-y-4"}>
      {!embedded && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Connexion rapide
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            QR codes à scanner pour accéder directement aux pages de connexion admin et employé.
            Les employés ont aussi un QR personnel à usage unique sur la page Équipe.
          </p>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <LoginQrCard portal="admin" />
        <LoginQrCard portal="employee" />
      </div>
    </section>
  );
}
