import { MapPin, Mountain, Users, Waves } from "lucide-react";
import { HeroContainer, HeroReveal, HeroSection, HeroStat } from "@/components/public/hero-ui";

const BASE_STATS = [
  { icon: Waves, label: "Sorties", value: "50+" },
  { icon: Users, label: "Voyageurs", value: "500+" },
  { icon: MapPin, label: "Destinations", value: "12+" },
  { icon: Mountain, label: "Années d'expérience", value: "5+" },
] as const;

export function StatsBar() {
  return (
    <HeroSection tone="white" className="border-y border-border/50 !py-12 md:!py-16">
      <HeroContainer>
        <HeroReveal>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {BASE_STATS.map(({ icon, label, value }) => (
              <HeroStat key={label} icon={icon} value={value} label={label} />
            ))}
          </div>
        </HeroReveal>
      </HeroContainer>
    </HeroSection>
  );
}
