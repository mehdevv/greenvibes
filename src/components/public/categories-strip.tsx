import { Reveal } from "@/components/motion";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { SectionHeading } from "@/components/public/section-heading";

const CATEGORIES = [
  { label: "Mer & criques", image: PLACEHOLDER_IMAGES.tichy },
  { label: "Montagne", image: PLACEHOLDER_IMAGES.gouraya },
  { label: "Aventure", image: PLACEHOLDER_IMAGES.kherrata },
  { label: "Coucher de soleil", image: PLACEHOLDER_IMAGES.corniche },
] as const;

export function CategoriesStrip() {
  return (
    <section className="gv-section bg-white">
      <div className="gv-container">
        <SectionHeading eyebrow="Ambiances" title="Choisis ton style de sortie" />

        <Reveal className="mt-12 md:mt-16">
          <div className="flex gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:justify-center md:gap-6">
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.label}
                className={`group relative shrink-0 overflow-hidden rounded-3xl shadow-sm ring-1 ring-border/30 transition hover:shadow-md ${
                  i === 1 ? "w-52 md:w-60" : "w-44 md:w-52"
                }`}
              >
                <img
                  src={cat.image}
                  alt=""
                  className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/20 to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-center text-sm font-semibold text-white md:text-base">
                  {cat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
