import heroNatureVideo from "@/assets/Algerian nature 🌲🇩🇿 - zack ohm (1080p).mp4";

export type GalleryMedia = {
  id: string;
  src: string;
  title: string;
  type: "image" | "video";
};

const GALLERY_TITLES = [
  "Ambiance de sortie",
  "Moments partagés",
  "Nature & paysages",
  "L'équipe en action",
  "Souvenirs GreenVibes",
  "Sur les sentiers",
  "Mer & soleil",
];

const imageModules = import.meta.glob<string>("../assets/gallery/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

const videoModules = import.meta.glob<string>("../assets/gallery/*.{mp4,webm}", {
  eager: true,
  import: "default",
});

function buildGallery(): GalleryMedia[] {
  const images = Object.entries(imageModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, src], index) => ({
      id: `img-${index}`,
      src,
      title: GALLERY_TITLES[index % GALLERY_TITLES.length],
      type: "image" as const,
    }));

  const videos = Object.entries(videoModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, src], index) => ({
      id: `vid-${index}`,
      src,
      title: `Vidéo sortie ${index + 1}`,
      type: "video" as const,
    }));

  return [...images, ...videos];
}

/** Bundled gallery from `src/assets/gallery` */
export const LOCAL_GALLERY_MEDIA = buildGallery();

export const HERO_VIDEOS = LOCAL_GALLERY_MEDIA.filter((m) => m.type === "video");

export const HERO_VIDEO_SOURCES =
  HERO_VIDEOS.length > 0
    ? HERO_VIDEOS.map((v) => ({ src: v.src }))
    : [{ src: heroNatureVideo }];
