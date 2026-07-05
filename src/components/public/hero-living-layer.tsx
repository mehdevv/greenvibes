import { motion } from "framer-motion";
import { Compass, MapPin, Mountain, Waves } from "lucide-react";
import accompagnement from "@/assets/accompagnement.png";
import { PLACEHOLDER_IMAGES } from "@/lib/constants";
import { easeOut } from "@/lib/motion";

const FLOAT_TILES = [
  {
    src: PLACEHOLDER_IMAGES.gouraya,
    label: "Montagne",
    className: "right-[8%] top-[18%] hidden w-28 rotate-6 lg:block xl:w-32",
    delay: 0,
  },
  {
    src: PLACEHOLDER_IMAGES.tichy,
    label: "Mer",
    className: "right-[22%] top-[42%] hidden w-24 -rotate-3 xl:block xl:w-28",
    delay: 0.4,
  },
  {
    src: PLACEHOLDER_IMAGES.kherrata,
    label: "Aventure",
    className: "right-[4%] bottom-[22%] hidden w-24 rotate-[-8deg] 2xl:block 2xl:w-28",
    delay: 0.8,
  },
] as const;

const BOKEH = [
  { x: "12%", y: "20%", size: 120, delay: 0 },
  { x: "78%", y: "15%", size: 160, delay: 1.2 },
  { x: "88%", y: "55%", size: 100, delay: 0.6 },
  { x: "55%", y: "75%", size: 140, delay: 1.8 },
  { x: "25%", y: "65%", size: 90, delay: 0.3 },
] as const;

const EXPERIENCE_BADGES = [
  { icon: Waves, label: "Mer" },
  { icon: Mountain, label: "Montagne" },
  { icon: Compass, label: "Culture" },
  { icon: MapPin, label: "Aventure" },
] as const;

type HeroLivingLayerProps = {
  reduceMotion: boolean | null;
};

export function HeroLivingLayer({ reduceMotion }: HeroLivingLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {/* Topographic contour lines */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.12]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M0 520 Q200 480 400 500 T800 490 T1200 510"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-mint hero-topo-line"
        />
        <path
          d="M0 580 Q300 540 600 560 T1200 550"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-mint hero-topo-line hero-topo-line-delayed"
        />
        <path
          d="M0 420 Q250 380 500 400 T900 390 T1200 410"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          className="text-white/60 hero-topo-line"
        />
        <path
          d="M100 0 Q350 200 500 350 T700 650 T900 800"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="6 10"
          className="text-leaf/80 hero-route-line"
        />
      </svg>

      {/* Soft bokeh orbs */}
      {BOKEH.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-mint/20 blur-3xl"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -18, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.08, 1],
                  opacity: [0.35, 0.55, 0.35],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 8 + i * 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: b.delay,
                }
          }
        />
      ))}

      {/* Floating destination polaroids */}
      {FLOAT_TILES.map((tile) => (
        <motion.div
          key={tile.label}
          className={`absolute ${tile.className}`}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={
            reduceMotion
              ? { opacity: 0.85 }
              : {
                  opacity: 0.9,
                  y: [0, -10, 0],
                  rotate: [6, 4, 6],
                }
          }
          transition={
            reduceMotion
              ? easeOut
              : {
                  opacity: { duration: 0.8, delay: tile.delay },
                  y: { duration: 5 + tile.delay, repeat: Infinity, ease: "easeInOut", delay: tile.delay },
                  rotate: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: tile.delay },
                }
          }
        >
          <div className="overflow-hidden rounded-md border border-white/25 bg-white/10 p-1.5 shadow-lg backdrop-blur-sm">
            <img src={tile.src} alt="" className="aspect-[4/3] w-full rounded-sm object-cover" />
            <span className="mt-1 block text-center text-[10px] font-medium tracking-wide text-white/90">
              {tile.label}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Illustration — ambient float, bottom-left */}
      <motion.div
        className="absolute bottom-[6%] left-[2%] hidden w-44 opacity-[0.28] sm:block md:w-52 lg:w-60 xl:w-72 xl:opacity-35"
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        animate={
          reduceMotion
            ? { opacity: 0.28 }
            : {
                opacity: [0.25, 0.38, 0.25],
                y: [0, -12, 0],
              }
        }
        transition={
          reduceMotion
            ? easeOut
            : {
                opacity: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        <img
          src={accompagnement}
          alt=""
          className="w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
        />
      </motion.div>

      {/* Compass accent */}
      <motion.div
        className="absolute left-[6%] top-[22%] hidden text-white/20 md:block"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 90, repeat: Infinity, ease: "linear" }
        }
      >
        <Compass className="h-16 w-16 stroke-[1]" />
      </motion.div>
    </div>
  );
}

export function HeroExperienceBadges({ reduceMotion }: HeroLivingLayerProps) {
  return (
    <motion.div
      className="mt-6 flex flex-wrap gap-2"
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } },
      }}
    >
      {EXPERIENCE_BADGES.map(({ icon: Icon, label }) => (
        <motion.span
          key={label}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
        >
          <Icon className="h-3.5 w-3.5 text-mint" />
          {label}
        </motion.span>
      ))}
    </motion.div>
  );
}
