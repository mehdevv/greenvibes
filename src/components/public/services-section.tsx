import { Reveal } from "@/components/motion";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import {
  HeroBlockHeader,
  HeroContainer,
  HeroLead,
  HeroMediaFrame,
  HeroSection,
  HeroTitle,
} from "@/components/public/hero-ui";

const SERVICES = [
  {
    num: "01",
    title: "Sorties organisées",
    text: "On te emmène sur des itinéraires qu'on connaît par cœur — criques, sentiers, couchers de soleil. Tu viens, on guide, tu profites.",
    image: PLACEHOLDER_IMAGES.tichy,
    imageLeft: true,
  },
  {
    num: "02",
    title: "Petits groupes, bonne vibe",
    text: "Pas de gros bus ni d'ambiance impersonnelle. On voyage à taille humaine, entre amis qui ne se connaissent pas encore.",
    image: PLACEHOLDER_IMAGES.gouraya,
    imageLeft: false,
  },
] as const;

export function ServicesSection() {
  return (
    <HeroSection tone="white">
      <HeroContainer>
        <HeroBlockHeader
          eyebrow="Nos sorties"
          title="Comment on voyage ensemble"
          subtitle="Simple, local et convivial — c'est notre façon de te faire découvrir la Petite Kabylie."
        />

        <div className="mt-16 space-y-20 md:mt-24 md:space-y-28 lg:space-y-32">
          {SERVICES.map((item, i) => (
            <Reveal key={item.num} delay={i * 0.08}>
              <div
                className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 xl:gap-24 ${
                  item.imageLeft ? "" : "lg:[&>div:first-child]:order-2"
                }`}
              >
                <HeroMediaFrame decor={false}>
                  <img
                    src={item.image}
                    alt=""
                    className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                    loading="lazy"
                  />
                </HeroMediaFrame>

                <div className="relative px-2 lg:px-6">
                  <span
                    className="pointer-events-none absolute -top-6 right-0 select-none font-display text-[5rem] font-bold leading-none text-forest/8 md:text-[7rem] lg:-top-10"
                    aria-hidden
                  >
                    {item.num}
                  </span>
                  <HeroTitle as="h3" className="relative text-forest md:text-3xl">
                    {item.title}
                  </HeroTitle>
                  <HeroLead className="relative mt-4">{item.text}</HeroLead>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </HeroContainer>
    </HeroSection>
  );
}
