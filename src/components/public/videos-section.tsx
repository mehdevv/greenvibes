import heroNatureVideo from "@/assets/Algerian nature 🌲🇩🇿 - zack ohm (1080p).mp4";

import { PLACEHOLDER_IMAGES } from "@/lib/constants";

import { MotionSection, Reveal, Stagger, StaggerItem } from "@/components/motion";

import { VideoPlayer } from "@/components/public/video-player";



const clips = [

  {

    id: "nature",

    title: "Nature & sentiers",

    caption: "L'Algérie en mode escapade",

    poster: PLACEHOLDER_IMAGES.gouraya,

    src: heroNatureVideo,

  },

  {

    id: "mer",

    title: "Mer & criques",

    caption: "Ambiance soleil et eau claire",

    poster: PLACEHOLDER_IMAGES.tichy,

    src: heroNatureVideo,

  },

  {

    id: "aventure",

    title: "Aventure",

    caption: "Gorges, sommets, sensations",

    poster: PLACEHOLDER_IMAGES.kherrata,

    src: heroNatureVideo,

  },

];



export function VideosSection() {

  return (

    <MotionSection id="videos" className="shopify-section bg-secondary">

      <div className="shopify-container">

        <Reveal>

          <p className="shopify-eyebrow">Vidéos</p>

          <h2 className="shopify-display mt-3 text-3xl sm:text-4xl">

            L&apos;ambiance GreenVibes

          </h2>

          <p className="shopify-body mt-4 max-w-2xl">

            Découvrez l&apos;énergie de nos sorties — nature, mer et convivialité.

          </p>

        </Reveal>



        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {clips.map((clip) => (

            <StaggerItem key={clip.id}>

              <VideoPlayer

                src={clip.src}

                poster={clip.poster}

                videoClassName="aspect-[4/5] sm:aspect-video lg:aspect-[4/5]"

                rounded="rounded-2xl"

                className="shadow-soft transition hover:shadow-elevated"

                overlay={

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-[var(--dark)]/80 to-transparent p-5 pt-20 text-white">

                    <h3 className="font-display text-lg font-normal">{clip.title}</h3>

                    <p className="mt-1 text-sm text-white/75">{clip.caption}</p>

                  </div>

                }

              />

            </StaggerItem>

          ))}

        </Stagger>

      </div>

    </MotionSection>

  );

}


