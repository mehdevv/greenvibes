import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EditableVideoPoster } from "@/components/admin/editable-image";
import { EditableText } from "@/components/admin/editable-text";
import { SITE_IMAGE_SLOTS } from "@/api/site-images";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import {
  HeroCard,
  HeroContainer,
  HeroEyebrow,
  HeroLead,
  HeroMediaFrame,
  HeroQuote,
  HeroSection,
  HeroTitle,
} from "@/components/public/hero-ui";
import teamVideo from "@/assets/Algerian nature 🌲🇩🇿 - zack ohm (1080p).mp4";

const BLOCKS = [
  { titleKey: "agency.block01.title", textKey: "agency.block01.text", title: "Qui on est", text: "On est une petite équipe de Béjaïa, passionnés de rando, de mer et de bons plans locaux. GreenVibes, c'est notre façon de partager l'Algérie qu'on aime — sans chichi." },
  { titleKey: "agency.block02.title", textKey: "agency.block02.text", title: "Notre façon de voyager", text: "Petits groupes, ambiance conviviale, rythme cool. On privilégie les lieux qu'on connaît vraiment, avec des gens du coin quand c'est possible." },
  { titleKey: "agency.block03.title", textKey: "agency.block03.text", title: "Pourquoi avec nous", text: "Parce qu'une sortie, ça doit rester simple : tu réserves, tu viens, tu kiffes. On gère l'organisation, toi tu profites." },
  { titleKey: "agency.block04.title", textKey: "agency.block04.text", title: "Notre engagement", text: "On respecte les lieux qu'on traverse et les communautés qui nous accueillent. On laisse les endroits aussi beaux qu'on les a trouvés." },
  { titleKey: "agency.block05.title", textKey: "agency.block05.text", title: "Ce qu'on te promet", text: "Des souvenirs, des paysages, et une équipe dispo avant, pendant et après la sortie. Pas de surprise sur le programme — tout est clair dès la réservation." },
];

function StoryBlock({
  titleKey,
  textKey,
  title,
  text,
  index,
}: {
  titleKey: string;
  textKey: string;
  title: string;
  text: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <HeroCard tone="sand" className="border border-forest/10 p-5 shadow-md md:p-6">
        <HeroTitle as="h3" className="text-lg text-forest md:text-xl">
          <EditableText textKey={titleKey} fallback={title} label="Modifier le titre" />
        </HeroTitle>
        <HeroLead className="mt-2 text-sm md:mt-3 md:text-base">
          <EditableText textKey={textKey} fallback={text} label="Modifier le texte" multiline as="span" />
        </HeroLead>
      </HeroCard>
    </motion.div>
  );
}

export function AgencySection() {
  return (
    <HeroSection id="agence" tone="white" padded={false} className="!overflow-visible">
      <HeroContainer className="px-5 py-14 sm:px-8 md:py-16 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-10 xl:grid-cols-[minmax(0,380px)_1fr] xl:gap-14">
          <div className="lg:sticky lg:top-24 lg:z-10 lg:max-w-[380px] lg:self-start xl:top-28">
            <HeroEyebrow>
              <EditableText textKey="agency.eyebrow" fallback="L'agence" label="Modifier le sur-titre" />
            </HeroEyebrow>
            <HeroTitle as="h2" className="mt-2 text-2xl text-forest md:text-[1.65rem] lg:text-2xl">
              <EditableText
                textKey="agency.title"
                fallback="Basés à Béjaïa, partout en Petite Kabylie"
                label="Modifier le titre"
              />
            </HeroTitle>
            <HeroLead className="mt-2 text-sm leading-relaxed md:text-base">
              <EditableText
                textKey="agency.lead"
                fallback="On te raconte qui on est pendant que tu scrolles — comme une conversation, pas un discours."
                label="Modifier l'introduction"
                multiline
                as="span"
              />
            </HeroLead>

            <EditableVideoPoster
              slot={SITE_IMAGE_SLOTS.agencyPoster}
              fallback={PLACEHOLDER_IMAGES.team}
              className="mt-5 max-w-[320px] lg:mt-6"
            >
              {(poster) => (
                <HeroMediaFrame decor={false}>
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={poster}
                    className="aspect-video w-full object-cover"
                  >
                    <source src={teamVideo} type="video/mp4" />
                  </video>
                </HeroMediaFrame>
              )}
            </EditableVideoPoster>

            <HeroQuote className="mt-4 max-w-[320px] text-sm md:text-base">
              <EditableText textKey="agency.quote" fallback="« L'Algérie qu'on aime, qu'on partage. »" label="Modifier la citation" />
            </HeroQuote>
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 lg:gap-5 xl:gap-6">
            {BLOCKS.map((b, i) => (
              <StoryBlock key={b.titleKey} {...b} index={i} />
            ))}
          </div>
        </div>
      </HeroContainer>
    </HeroSection>
  );
}
