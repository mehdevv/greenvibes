-- Demo trips for GreenVibes v2 (run after 006_v2_trips_reservations.sql)

INSERT INTO public.trips (id, title, description, photo_url, meeting_point, includes, price, duration, capacity, spots_taken, active) VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    'Criques de Tichy — Demi-journée',
    'On part ensemble découvrir les criques emblématiques de Tichy : eau claire, falaises et bonne humeur. Idéal pour une première sortie avec nous.',
    NULL,
    'Front de mer, Béjaïa — point de rendez-vous envoyé après réservation',
    ARRAY['Guide local', 'Snack sur la plage', 'Photos de groupe'],
    2900,
    'Demi-journée',
    12,
    3,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Week-end découverte',
    'Deux jours entre mer et montagne : on dort chez l''habitant, on randonne le matin, on finit les pieds dans l''eau l''après-midi.',
    NULL,
    'Gare routière de Béjaïa',
    ARRAY['Hébergement 1 nuit', 'Petits-déjeuners', 'Transport sur place'],
    12900,
    '2 jours',
    10,
    7,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Gorges de Kherrata',
    'Sentiers, ponts naturels et panoramas — une journée d''aventure accessible, en petit groupe, sans prise de tête.',
    NULL,
    'Parking entrée gorges — Kherrata',
    ARRAY['Guide', 'Collation', 'Transport A/R depuis Béjaïa'],
    3500,
    'Journée',
    14,
    14,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    'Corniche — Soirée coucher de soleil',
    'On marche le long de la corniche, on s''arrête pour un thé, on admire le soleil qui tombe sur la Méditerranée.',
    NULL,
    'Place du 1er Novembre, Béjaïa',
    ARRAY['Guide', 'Thé local', 'Transport'],
    1800,
    'Soirée',
    16,
    2,
    true
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    'Parc de Gouraya',
    'Randonnée douce dans le parc national : forêts, vue sur la baie, pique-nique au sommet.',
    NULL,
    'Entrée principale du parc, Gouraya',
    ARRAY['Guide', 'Pique-nique', 'Transport'],
    3200,
    'Journée',
    12,
    5,
    true
  )
ON CONFLICT (id) DO NOTHING;
