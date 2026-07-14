import { Facebook, Instagram, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { HeroContainer, HeroEyebrow } from "@/components/public/hero-ui";
import { AGENCY_CONTACT } from "@/lib/constants";

const FOOTER_LINKS = [
  { label: "Offres", href: "#voyages" },
  { label: "L'agence", href: "#agence" },
  { label: "Galerie", href: "#galerie" },
  { label: "Contact", href: "#contact" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-forest px-6 pt-16 pb-8 text-white">
      <HeroContainer>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="lg:col-span-1">
            <Logo size="md" showText textClassName="text-lg font-bold text-white" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              Sorties fun depuis Béjaïa — mer, montagne et bons plans en Petite Kabylie.
            </p>
            <p className="mt-3 text-sm text-white/60">{AGENCY_CONTACT.address}</p>
          </div>

          <div>
            <HeroEyebrow className="text-sun">Explorer</HeroEyebrow>
            <ul className="mt-4 space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/75 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <HeroEyebrow className="text-sun">Contact</HeroEyebrow>
            <ul className="mt-4 space-y-3 text-sm text-white/75">
              <li>
                <a
                  href={`tel:${AGENCY_CONTACT.phone}`}
                  className="inline-flex items-center gap-2 transition hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                  {AGENCY_CONTACT.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <HeroEyebrow className="text-sun">Réseaux</HeroEyebrow>
            <div className="mt-4 flex gap-3">
              <a
                href={AGENCY_CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-coral"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={AGENCY_CONTACT.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-coral"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <p className="mt-14 border-t border-white/15 pt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {AGENCY_CONTACT.name}. Tous droits réservés.
        </p>
      </HeroContainer>
    </footer>
  );
}
