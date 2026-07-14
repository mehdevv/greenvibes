import { Link } from "@tanstack/react-router";

import heroNatureVideo from "@/assets/Algerian nature 🌲🇩🇿 - zack ohm (1080p).mp4";

import { PLACEHOLDER_IMAGES, DEFAULT_OFFRES_SEARCH } from "@/lib/constants";

import { MotionSection, Reveal } from "@/components/motion";

import { VideoPlayer } from "@/components/public/video-player";



export function VslSection() {

  return (

    <MotionSection id="vsl" className="shopify-section bg-background">

      <div className="shopify-container">

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

          <Reveal>

            <p className="shopify-eyebrow">Qui on est</p>

            <h2 className="shopify-display mt-3 text-3xl sm:text-4xl">

              Voyagez à travers l&apos;Algérie avec{" "}

              <span className="text-forest">GreenVibes</span>

            </h2>

            <p className="shopify-body mt-5">

              GreenVibes est une agence de sorties basée à Béjaïa. Escapades authentiques — mer,

              montagne, ambiance conviviale — pour découvrir le patrimoine local autrement, entre

              potes, en famille ou en équipe.

            </p>

            <p className="mt-4 text-base text-muted-foreground">

              Choisissez une sortie, réservez en deux minutes, et on s&apos;occupe du reste.

            </p>

            <div className="mt-10 flex flex-wrap gap-3">

              <Link to="/offres" search={DEFAULT_OFFRES_SEARCH} className="btn-pill-primary">

                Voir les sorties

              </Link>

              <Link to="/a-propos" className="btn-pill-outline">

                En savoir plus

              </Link>

            </div>

          </Reveal>



          <Reveal delay={0.08} variant="fadeLeft">

            <VideoPlayer

              src={heroNatureVideo}

              poster={PLACEHOLDER_IMAGES.kherrata}

              videoClassName="aspect-video"

              rounded="rounded-3xl"

              className="shadow-lift"

            />

          </Reveal>

        </div>

      </div>

    </MotionSection>

  );

}


