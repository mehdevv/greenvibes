-- Seed destinations, offers, sessions, blog, gallery

INSERT INTO public.destinations (id, slug, title, tag, description, cover_image, latitude, longitude, is_published, sort_order) VALUES
  ('d1000000-0000-4000-8000-000000000001', 'parc-gouraya', 'Parc National de Gouraya', 'Montagne',
   'Sentiers boisés, panoramas sur la Méditerranée et faune locale au cœur du parc national.',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&q=80', 36.7667, 5.0833, true, 1),
  ('d1000000-0000-4000-8000-000000000002', 'criques-tichy', 'Criques de Tichy', 'Mer',
   'Eaux turquoise et criques secrètes accessibles en bateau ou par sentier côtier.',
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024&q=80', 36.7500, 5.1000, true, 2),
  ('d1000000-0000-4000-8000-000000000003', 'gorges-kherrata', 'Gorges de Kherrata', 'Aventure',
   'Canyon spectaculaire, ponts naturels et randonnées pour les amateurs de sensations.',
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1024&q=80', 36.5000, 4.7500, true, 3),
  ('d1000000-0000-4000-8000-000000000004', 'corniche-bejaia', 'Corniche de Béjaïa', 'Coucher de soleil',
   'Promenade en bord de mer, couchers de soleil et ambiance méditerranéenne.',
   'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1024&q=80', 36.7525, 5.0553, true, 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.offers (id, destination_id, slug, title, description, price_dzd, duration_label, offer_type, features, cover_image, is_active, is_featured, sort_order) VALUES
  ('e1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
   'excursion-journee', 'Excursion à la journée',
   'Une journée guidée entre criques, sentiers et déjeuner local.',
   3500, 'Journée', 'montagne',
   '["Guide francophone", "Transport A/R", "Déjeuner inclus"]'::jsonb,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&q=80', true, false, 1),
  ('e1000000-0000-4000-8000-000000000002', 'd1000000-0000-4000-8000-000000000002',
   'weekend-decouverte', 'Week-end découverte',
   'Deux jours entre mer et montagne avec nuit en maison d''hôtes.',
   12900, '2 jours', 'mer',
   '["Hébergement", "Deux excursions", "Petits-déjeuners"]'::jsonb,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024&q=80', true, true, 2),
  ('e1000000-0000-4000-8000-000000000003', 'd1000000-0000-4000-8000-000000000003',
   'sejour-authentique', 'Séjour authentique',
   'Cinq jours pour explorer la Kabylie côtière en petit groupe.',
   34500, '5 jours', 'aventure',
   '["Circuit complet", "Groupe de 8 max.", "Rencontres locales"]'::jsonb,
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1024&q=80', true, false, 3),
  ('e1000000-0000-4000-8000-000000000004', 'd1000000-0000-4000-8000-000000000002',
   'criques-tichy-demi-journee', 'Criques de Tichy — Demi-journée',
   'Découverte des criques emblématiques de Tichy en petit groupe.',
   2900, 'Demi-journée', 'mer',
   '["Guide local", "Snorkeling", "Collation"]'::jsonb,
   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1024&q=80', true, false, 4),
  ('e1000000-0000-4000-8000-000000000005', 'd1000000-0000-4000-8000-000000000004',
   'corniche-soiree', 'Corniche — Soirée coucher de soleil',
   'Balade guidée sur la corniche avec pause thé et photos au coucher du soleil.',
   1800, 'Soirée', 'culture',
   '["Guide", "Thé local", "Transport"]'::jsonb,
   'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1024&q=80', true, false, 5)
ON CONFLICT (slug) DO NOTHING;

-- Sessions for next 60 days (weekends + some weekdays)
INSERT INTO public.trip_sessions (offer_id, session_date, capacity, booked_count, status)
SELECT o.id, d::date, 12, 0, 'open'
FROM public.offers o
CROSS JOIN generate_series(current_date + 1, current_date + 60, '1 day') AS d
WHERE o.is_active = true
  AND (extract(dow from d) IN (0, 5, 6) OR random() < 0.15)
ON CONFLICT (offer_id, session_date) DO NOTHING;

INSERT INTO public.blog_posts (slug, title, excerpt, body, cover_image, published_at) VALUES
  ('decouvrir-bejaia', '5 raisons de découvrir Béjaïa cette saison',
   'Entre mer et montagne, la perle de la Petite Kabylie séduit les voyageurs.',
   'Béjaïa offre un mélange unique de paysages côtiers et de montagnes verdoyantes. Que vous soyez amateur de randonnée, de plage ou de culture locale, vous trouverez votre bonheur...',
   'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&q=80', now() - interval '3 days'),
  ('gouraya-guide', 'Guide pratique : randonner au Parc de Gouraya',
   'Conseils, équipement et meilleures saisons pour explorer le parc national.',
   'Le Parc National de Gouraya est l''un des joyaux de l''Algérie. Voici tout ce qu''il faut savoir avant de partir...',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', now() - interval '10 days')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.gallery_items (title, storage_path, destination_id, sort_order) VALUES
  ('Baie de Béjaïa', 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&q=80', NULL, 1),
  ('Gouraya', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 'd1000000-0000-4000-8000-000000000001', 2),
  ('Criques', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', 'd1000000-0000-4000-8000-000000000002', 3),
  ('Montagnes', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80', 'd1000000-0000-4000-8000-000000000003', 4),
  ('Équipe', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80', NULL, 5);
