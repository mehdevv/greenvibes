import { cn } from "@/lib/utils";

type SectionWaveProps = {
  fill?: string;
  className?: string;
  flip?: boolean;
};

export function SectionWave({ fill = "#F5F0E6", className, flip }: SectionWaveProps) {
  return (
    <div className={cn("pointer-events-none -mt-px w-full overflow-hidden leading-[0]", className)}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className={cn("block h-12 w-full md:h-16", flip && "rotate-180")}
        aria-hidden
      >
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
