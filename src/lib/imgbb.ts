const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY ?? "";

const MAX_BYTES = 10 * 1024 * 1024;

export function isImgbbConfigured(): boolean {
  return Boolean(IMGBB_API_KEY);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToImgbb(file: File): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error("Clé API ImgBB manquante. Ajoutez VITE_IMGBB_API_KEY dans votre fichier .env");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Image trop volumineuse (maximum 10 Mo).");
  }

  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;

  const body = new FormData();
  body.append("image", base64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: "POST",
    body,
  });

  const json = (await response.json()) as {
    success?: boolean;
    status_txt?: string;
    error?: { message?: string };
    data?: { url?: string; display_url?: string };
  };

  if (!response.ok || !json.success || !json.data?.url) {
    throw new Error(json.error?.message ?? json.status_txt ?? "Échec du téléversement ImgBB");
  }

  return json.data.url;
}
