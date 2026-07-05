# GreenVibes Platform

Tourism booking platform for GreenVibes Agency (Béjaïa, Algeria).

## Stack

- React 19 + Vite + TypeScript
- TanStack Router + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres, Auth, RLS, Edge Functions)

## Setup

1. Copy `.env.example` to `.env` and add your Supabase credentials.
2. Run migrations in Supabase SQL editor:
   - `supabase/migrations/001_greenvibes_initial.sql`
   - `supabase/seed.sql`
3. Deploy Edge Functions: `setup-admin`, `send-booking-confirmation`
4. Install and run:

```bash
npm install
npm run dev
```

5. Open `/admin/login` to create the first admin account.

## Public routes

- `/` — Homepage
- `/destinations` — Destination gallery
- `/offres` — Offers catalog
- `/reservation` — 4-step booking wizard
- `/a-propos`, `/galerie`, `/blog`, `/contact`

## Admin routes

- `/admin/dashboard` — KPIs and analytics
- `/admin/reservations` — Booking management
- `/admin/offres` — Trip CRUD
- `/admin/sessions` — Departure dates & capacity
- `/admin/destinations`, `/admin/clients`, `/admin/blog`, `/admin/galerie`, `/admin/messages`
