import { Link } from "@tanstack/react-router";
import { DEFAULT_OFFRES_SEARCH } from "@/lib/constants";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-card/90 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-5">
        <Reveal className="md:col-span-2">
          <Logo size="md" showText text="GreenVibes Agency" textClassName="text-forest" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Agence de tourisme authentique et responsable, basée à Béjaïa. Circuits et séjours dans toute
            l&apos;Algérie.
          </p>
          <Stagger className="mt-5 flex items-center gap-3">
            {[Instagram, Facebook].map((Icon, i) => (
              <StaggerItem key={i}>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-[4px] bg-secondary text-forest transition hover:bg-forest hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="text-sm font-medium text-forest">Explorer</div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/destinations" className="hover:text-forest">
                Destinations
              </Link>
            </li>
            <li>
              <Link to="/offres" search={DEFAULT_OFFRES_SEARCH} className="hover:text-forest">
                Circuits & offres
              </Link>
            </li>
            <li>
              <Link to="/galerie" className="hover:text-forest">
                Galerie
              </Link>
            </li>
            <li>
              <a href="/#services" className="hover:text-forest">
                Nos services
              </a>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="text-sm font-medium text-forest">Informations</div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/a-propos" className="hover:text-forest">
                À propos
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-forest">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-forest">
                Contact
              </Link>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="text-sm font-medium text-forest">Contact</div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Béjaïa, Algérie
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> +213 (0)00 00 00 00
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> hello@greenvibes.dz
            </li>
          </ul>
        </Reveal>
      </div>
      <Reveal delay={0.05}>
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} GreenVibes Agency — Tourisme authentique & responsable.
          </div>
        </div>
      </Reveal>
    </footer>
  );
}
