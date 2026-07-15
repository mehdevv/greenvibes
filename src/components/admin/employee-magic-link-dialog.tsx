import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { Copy, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCreateEmployeeMagicLink, type EmployeeMagicLinkResult } from "@/api/employee-magic-login";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EmployeeMagicLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
  initialLink?: EmployeeMagicLinkResult | null;
};

function formatExpiry(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function EmployeeMagicLinkDialog({
  open,
  onOpenChange,
  workerId,
  workerName,
  initialLink,
}: EmployeeMagicLinkDialogProps) {
  const createLink = useCreateEmployeeMagicLink();
  const [link, setLink] = useState<EmployeeMagicLinkResult | null>(initialLink ?? null);

  useEffect(() => {
    if (open && initialLink) {
      setLink(initialLink);
    }
  }, [open, initialLink]);

  useEffect(() => {
    if (!open) return;
    if (link) return;
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, workerId]);

  const generate = async () => {
    try {
      const result = await createLink.mutateAsync(workerId);
      setLink(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de générer le lien");
    }
  };

  const handleCopy = async () => {
    if (!link?.loginUrl) return;
    try {
      await navigator.clipboard.writeText(link.loginUrl);
      toast.success("Lien copié");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const handleRegenerate = async () => {
    setLink(null);
    await generate();
    toast.success("Nouveau lien généré — l'ancien ne fonctionne plus");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-forest" />
            Connexion instantanée
          </DialogTitle>
          <DialogDescription>
            Lien à usage unique pour <span className="font-medium text-foreground">{workerName}</span>.
            Scannez le QR ou partagez le lien — valable une seule connexion.
          </DialogDescription>
        </DialogHeader>

        {createLink.isPending && !link ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Génération du lien…
          </div>
        ) : link ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border bg-white p-3 shadow-sm">
              <QRCode
                value={link.loginUrl}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#1b4332"
                title={`Connexion employé — ${workerName}`}
              />
            </div>
            <code className="block w-full break-all rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs">
              {link.loginUrl}
            </code>
            <p className="text-center text-xs text-muted-foreground">
              Expire le {formatExpiry(link.expiresAt)} si non utilisé
            </p>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-destructive">
            Échec de génération
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={!link || createLink.isPending}
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
            Copier le lien
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            disabled={createLink.isPending}
            onClick={handleRegenerate}
          >
            <RefreshCw className={createLink.isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Nouveau lien
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
