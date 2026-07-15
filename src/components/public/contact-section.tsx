import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { EditableBlockHeader } from "@/components/admin/editable-text";
import { AGENCY_CONTACT } from "@/lib/constants";
import {
  HeroCard,
  HeroContainer,
  HeroDecorBlob,
  HeroLead,
  HeroReveal,
  HeroSection,
} from "@/components/public/hero-ui";

export function ContactSection() {
  return (
    <HeroSection id="contact" tone="sand" className="relative overflow-hidden">
      <HeroDecorBlob position="tl" />
      <HeroDecorBlob position="br" />

      <HeroContainer className="relative">
        <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-12 xl:gap-16">
          <HeroReveal>
            <EditableBlockHeader
              align="left"
              title="On se parle ?"
              titleKey="contact.title"
              subtitle="Une question sur une sortie ou envie de réserver ? Appelle-nous, passe sur WhatsApp ou viens nous voir à l'agence."
              subtitleKey="contact.subtitle"
            />

            <div className="mt-8 space-y-5">
              <a
                href={`tel:${AGENCY_CONTACT.phone}`}
                className="flex items-center gap-3 text-lg font-semibold text-forest transition hover:text-leaf"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border/40">
                  <Phone className="h-5 w-5" />
                </span>
                {AGENCY_CONTACT.phoneDisplay}
              </a>

              <a
                href={`mailto:${AGENCY_CONTACT.email}`}
                className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-forest"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border/40">
                  <Mail className="h-5 w-5 text-forest" />
                </span>
                <span className="pt-2.5 font-medium text-foreground">{AGENCY_CONTACT.email}</span>
              </a>

              <a
                href={AGENCY_CONTACT.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-sm text-muted-foreground transition hover:text-forest"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border/40">
                  <MapPin className="h-5 w-5 text-forest" />
                </span>
                <span className="pt-2.5 leading-relaxed">{AGENCY_CONTACT.address}</span>
              </a>

              <div className="flex items-center gap-3 pt-1">
                <a
                  href={AGENCY_CONTACT.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram GreenVibes"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-forest shadow-sm ring-1 ring-border/40 transition hover:bg-mint"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href={AGENCY_CONTACT.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook GreenVibes"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-forest shadow-sm ring-1 ring-border/40 transition hover:bg-mint"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <HeroLead className="text-sm">@gree.n_vibes sur Instagram</HeroLead>
              </div>
            </div>
          </HeroReveal>

          <HeroReveal delay={0.1} className="min-h-[320px] lg:min-h-[480px]">
            <HeroCard className="h-full min-h-[320px] overflow-hidden lg:min-h-[480px]">
              <iframe
                src={AGENCY_CONTACT.mapsEmbedUrl}
                title="GreenVibes — Green travel, Béjaïa"
                className="h-full min-h-[320px] w-full border-0 lg:min-h-[480px]"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </HeroCard>
          </HeroReveal>
        </div>
      </HeroContainer>
    </HeroSection>
  );
}
