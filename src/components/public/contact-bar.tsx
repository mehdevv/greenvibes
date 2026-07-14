import { useEffect, useState } from "react";
import { Facebook, Instagram, Phone } from "lucide-react";
import { AGENCY_CONTACT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SCROLL_COLLAPSE = 100;

export function ContactBar() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > SCROLL_COLLAPSE);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] border-b border-[#2D6A4F]/10 bg-[#F8F0E3]/95 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href={`tel:${AGENCY_CONTACT.phone}`}
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] transition hover:text-[#52B788]",
            compact && "sm:gap-2",
          )}
        >
          <Phone className="h-4 w-4 shrink-0" />
          <span className={cn(compact && "sr-only sm:not-sr-only")}>{AGENCY_CONTACT.phoneDisplay}</span>
        </a>
        <div className="flex items-center gap-2">
          <a
            href={AGENCY_CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram GreenVibes"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#2D6A4F] transition hover:bg-[#D8F3DC] hover:text-[#52B788]"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href={AGENCY_CONTACT.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook GreenVibes"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#2D6A4F] transition hover:bg-[#D8F3DC] hover:text-[#52B788]"
          >
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
