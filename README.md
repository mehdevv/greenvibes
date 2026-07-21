# GreenVibes Platform

One-page tourism website + minimal admin back-office for GreenVibes Agency (Béjaïa, Algeria).

## Stack

- React 19 + Vite + TypeScript
- TanStack Router + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres, Auth, Realtime, RLS)
- Framer Motion

## Setup

1. Copy `.env.example` to `.env` and add your Supabase credentials.
2. In Supabase → **SQL Editor**, paste and run the entire file:
   - **`supabase/schema.sql`** (complete schema — no seeds)
3. Enable Realtime on `trips` if not applied by the script (Database → Replication).
4. Deploy Edge Functions (see **Edge Functions** below)
5. Install and run:

```bash
npm install
npm run dev
```

6. Open `/admin/login` to create the first admin account.

## Public routes

- `/` — Single scrollable page (hero video, trips, agency, gallery)
- `/reservation/:tripId` — Reservation form (4 fields)

All other former public routes redirect to `/`.

## Admin routes

- `/admin/dashboard` — Statistics
- `/admin/trips` — Trip CRUD
- `/admin/reservations` — Reservation management

## Edge Functions

| Function | Required | Called with public key | Purpose |
|----------|----------|------------------------|---------|
| `setup-admin` | Yes (once) | Yes (`anon` / publishable) | Create the first admin account |
| `create-reservation` | Recommended | Yes (`anon` / publishable) | Public trip booking (wraps `create_reservation` RPC) |
| `send-reservation-notification` | Optional | Internal / service role | Email alert to agency on new booking |
| `send-booking-confirmation` | Optional | Yes | Legacy v1 bookings only |

### Deploy (Supabase CLI)

```bash
# 1. Install CLI & login
npm install -g supabase
supabase login

# 2. Link your project (Dashboard → Project Settings → General → Reference ID)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Optional secrets for email notifications
supabase secrets set RESEND_API_KEY=re_xxxx
supabase secrets set RESEND_FROM="GreenVibes <noreply@yourdomain.com>"
supabase secrets set AGENCY_NOTIFY_EMAIL=you@greenvibes.dz

# 4. Deploy all functions
supabase functions deploy setup-admin
supabase functions deploy create-reservation
supabase functions deploy send-reservation-notification
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically in production.

### Call from the browser (public token)

Your frontend already uses `VITE_SUPABASE_ANON_KEY` (publishable key). No extra setup — `supabase.functions.invoke()` sends:

- `Authorization: Bearer <anon_key>`
- `apikey: <anon_key>`

Manual test with curl:

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/create-reservation" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tripId": "TRIP_UUID",
    "firstName": "Amine",
    "lastName": "Benali",
    "phone": "0559841220",
    "location": "Béjaïa"
  }'
```

First admin setup:

```bash
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/setup-admin" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@greenvibes.dz",
    "password": "your-secure-password",
    "fullName": "Admin GreenVibes"
  }'
```

Find your keys in **Supabase Dashboard → Project Settings → API** (`anon` / `publishable` key).

## Demo data

Run `supabase/seed_trips.sql` in the SQL editor if you want sample trips in a fresh project. The public homepage only shows trips created in the admin (no bundled demo offers).
