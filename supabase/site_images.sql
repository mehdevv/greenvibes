-- Homepage CMS: editable images, extra gallery photos, presentation blocks
-- Run in Supabase SQL Editor (after admin helpers exist)

CREATE TABLE IF NOT EXISTS public.site_images (
  slot text PRIMARY KEY,
  url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_images_public_read ON public.site_images;
DROP POLICY IF EXISTS site_images_admin_write ON public.site_images;

CREATE POLICY site_images_public_read ON public.site_images
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_images_admin_write ON public.site_images
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_images TO anon, authenticated;
GRANT ALL ON public.site_images TO authenticated;

-- Extra gallery images (admin uploads — shown after bundled gallery)
CREATE TABLE IF NOT EXISTS public.site_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  title text NOT NULL DEFAULT 'Souvenir GreenVibes',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_gallery_public_read ON public.site_gallery_items;
DROP POLICY IF EXISTS site_gallery_admin_write ON public.site_gallery_items;

CREATE POLICY site_gallery_public_read ON public.site_gallery_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_gallery_admin_write ON public.site_gallery_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_gallery_items TO anon, authenticated;
GRANT ALL ON public.site_gallery_items TO authenticated;

-- Extra presentation blocks (admin adds below blocks 01–03)
CREATE TABLE IF NOT EXISTS public.site_presentation_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  image_left boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_presentation_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_presentation_public_read ON public.site_presentation_blocks;
DROP POLICY IF EXISTS site_presentation_admin_write ON public.site_presentation_blocks;

CREATE POLICY site_presentation_public_read ON public.site_presentation_blocks
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_presentation_admin_write ON public.site_presentation_blocks
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_presentation_blocks TO anon, authenticated;
GRANT ALL ON public.site_presentation_blocks TO authenticated;

-- Extra hero carousel videos (admin uploads — shown after bundled hero videos)
CREATE TABLE IF NOT EXISTS public.site_hero_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_hero_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_hero_videos_public_read ON public.site_hero_videos;
DROP POLICY IF EXISTS site_hero_videos_admin_write ON public.site_hero_videos;

CREATE POLICY site_hero_videos_public_read ON public.site_hero_videos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_hero_videos_admin_write ON public.site_hero_videos
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_hero_videos TO anon, authenticated;
GRANT ALL ON public.site_hero_videos TO authenticated;

-- Public bucket for homepage videos (images still use ImgBB)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-media', 'site-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS site_media_public_read ON storage.objects;
DROP POLICY IF EXISTS site_media_admin_write ON storage.objects;

CREATE POLICY site_media_public_read ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'site-media');

CREATE POLICY site_media_admin_write ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'site-media' AND public.can_write_admin())
  WITH CHECK (bucket_id = 'site-media' AND public.can_write_admin());

-- Hide / reorder gallery items and hero videos (item_key e.g. gallery:img-0, hero:bundled-0)
CREATE TABLE IF NOT EXISTS public.site_media_layout (
  item_key text PRIMARY KEY,
  sort_order bigint NOT NULL DEFAULT 0,
  hidden boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_media_layout ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_media_layout_public_read ON public.site_media_layout;
DROP POLICY IF EXISTS site_media_layout_admin_write ON public.site_media_layout;

CREATE POLICY site_media_layout_public_read ON public.site_media_layout
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_media_layout_admin_write ON public.site_media_layout
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_media_layout TO anon, authenticated;
GRANT ALL ON public.site_media_layout TO authenticated;

-- Editable homepage copy (key → text value)
CREATE TABLE IF NOT EXISTS public.site_texts (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_texts_public_read ON public.site_texts;
DROP POLICY IF EXISTS site_texts_admin_write ON public.site_texts;

CREATE POLICY site_texts_public_read ON public.site_texts
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_texts_admin_write ON public.site_texts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.can_write_admin());

GRANT SELECT ON public.site_texts TO anon, authenticated;
GRANT ALL ON public.site_texts TO authenticated;
