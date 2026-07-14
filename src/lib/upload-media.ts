import { supabase } from "@/lib/supabase";

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export async function uploadVideoToStorage(file: File): Promise<string> {
  if (!file.type.startsWith("video/")) {
    throw new Error("Format non supporté. Utilisez MP4 ou WebM.");
  }

  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("Vidéo trop volumineuse (maximum 50 Mo).");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const safeExt = ["mp4", "webm", "mov"].includes(ext) ? ext : "mp4";
  const path = `hero-videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const { error } = await supabase.storage.from("site-media").upload(path, file, {
    contentType: file.type || "video/mp4",
    upsert: false,
  });

  if (error) {
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Bucket site-media manquant. Exécutez supabase/site_images.sql dans Supabase.",
      );
    }
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("site-media").getPublicUrl(path);
  return data.publicUrl;
}
