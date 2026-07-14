import { useEffect, useState } from "react";
import { Facebook, Instagram, Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { HeroButton, HeroContainer, HeroEyebrow } from "@/components/public/hero-ui";
import { AGENCY_CONTACT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Offres", href: "#voyages" },
  { label: "L'agence", href: "#agence" },
  { label: "Galerie", href: "#galerie" },
  { label: "Contact", href: "#contact" },
] as const;

function scrollTo(href: string) {
  const id = href.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] border-b transition-all duration-300",
        scrolled
          ? "border-border/60 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white/80 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:h-[4.5rem]">
        <a href="/" className="shrink-0" aria-label="GreenVibes — accueil">
          <Logo size="md" showText textClassName="text-base font-bold text-forest sm:text-lg" />
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-muted-foreground transition hover:text-forest"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={`tel:${AGENCY_CONTACT.phone}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest transition hover:bg-mint hover:text-leaf xl:w-auto xl:gap-1.5 xl:px-3"
            title={AGENCY_CONTACT.phoneDisplay}
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span className="hidden text-sm font-medium xl:inline">{AGENCY_CONTACT.phoneDisplay}</span>
          </a>
          <a
            href={AGENCY_CONTACT.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest transition hover:bg-mint hover:text-leaf"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href={AGENCY_CONTACT.facebook}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest transition hover:bg-mint hover:text-leaf"
          >
            <Facebook className="h-4 w-4" />
          </a>
          <HeroButton
            variant="accent"
            size="md"
            onClick={() => scrollTo("#voyages")}
            className="h-9 shrink-0 px-4 py-0"
          >
            Réserver
          </HeroButton>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-forest transition hover:bg-mint lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-white px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => {
                  scrollTo(link.href);
                  setOpen(false);
                }}
                className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-foreground transition hover:bg-sand"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
            <a
              href={`tel:${AGENCY_CONTACT.phone}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm font-medium text-forest"
            >
              <Phone className="h-4 w-4" />
              Appeler
            </a>
            <HeroButton
              variant="accent"
              size="md"
              onClick={() => {
                scrollTo("#voyages");
                setOpen(false);
              }}
              className="flex-1"
            >
              Réserver
            </HeroButton>
          </div>
        </div>
      )}
    </header>
  );
}
