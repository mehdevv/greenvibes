import { Link } from "@tanstack/react-router";
import { AGENCY_CONTACT, DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export function PublicFooter() {
  return (
    <footer className="relative z-10 bg-[var(--dark)] text-white">
      <div className="shopify-container grid gap-12 py-16 md:grid-cols-4 md:py-20">
        <Reveal className="md:col-span-2">
          <Logo size="md" showText text="GreenVibes Agency" textClassName="text-white" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Sorties fun et escapades en Algérie — basés à Béjaïa. Choisissez une offre, réservez
            en deux minutes.
          </p>
          <Stagger className="mt-6 flex items-center gap-3">
            <StaggerItem>
              <a
                href={AGENCY_CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-leaf hover:text-white"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </StaggerItem>
            <StaggerItem>
              <a
                href={AGENCY_CONTACT.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-leaf hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </StaggerItem>
          </Stagger>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="text-sm font-medium text-leaf">Explorer</div>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li>
              <Link to="/offres" search={DEFAULT_OFFRES_SEARCH} className="hover:text-white">
                Sorties
              </Link>
            </li>
            <li>
              <Link to="/a-propos" className="hover:text-white">
                À propos
              </Link>
            </li>
            <li>
              <Link to="/galerie" className="hover:text-white">
                Galerie
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="text-sm font-medium text-leaf">Contact</div>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-leaf" /> {AGENCY_CONTACT.address}
            </li>
            <li className="flex items-center gap-2">
              <a href={`tel:${AGENCY_CONTACT.phone}`} className="hover:text-white">
                <Phone className="mr-2 inline h-4 w-4 shrink-0 text-leaf" />
                {AGENCY_CONTACT.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-leaf" />{" "}
              <a href={`mailto:${AGENCY_CONTACT.email}`} className="hover:text-white">
                {AGENCY_CONTACT.email}
              </a>
            </li>
          </ul>
        </Reveal>
      </div>
      <Reveal delay={0.05}>
        <div className="border-t border-white/10">
          <div className="shopify-container py-6 text-xs text-white/50">
            © {new Date().getFullYear()} GreenVibes Agency — Sorties fun en Algérie.
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
