/** Warm browser cache for a list of image URLs (e.g. carousel slides). */
export function preloadImages(urls: Array<string | null | undefined>): void {
  const seen = new Set<string>();
  for (const raw of urls) {
    const url = raw?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

/** Resolve when an image is cached (or on error / timeout). */
export function preloadImage(url: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    const timer = setTimeout(done, timeoutMs);
    img.onload = () => {
      clearTimeout(timer);
      done();
    };
    img.onerror = () => {
      clearTimeout(timer);
      done();
    };
    img.decoding = "async";
    img.src = url;
  });
}
