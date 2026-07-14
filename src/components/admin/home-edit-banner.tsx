import { Link } from "@tanstack/react-router";
import { ImageIcon, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export function HomeEditBanner() {
  const { user, canWrite } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || !canWrite || dismissed) return null;

  return (
    <>
      <div className="fixed top-16 right-0 left-0 z-[55] border-b border-forest/20 bg-forest text-white shadow-md lg:top-[4.5rem]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-2.5 sm:px-8">
          <p className="flex items-center gap-2 text-sm">
            <ImageIcon className="h-4 w-4 shrink-0" />
            <span>
              <strong>Mode édition</strong> — cliquez textes, images ou vidéos pour les modifier ; utilisez les flèches
              pour réordonner et la corbeille pour masquer ou supprimer.
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/admin/trips"
              className="hidden rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25 sm:inline"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-full p-1 hover:bg-white/15"
              aria-label="Masquer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="h-11 shrink-0" aria-hidden />
    </>
  );
}
