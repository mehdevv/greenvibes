-- One-time employee magic login tokens (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS public.employee_login_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_login_tokens_worker_active_idx
  ON public.employee_login_tokens (worker_id, created_at DESC)
  WHERE used_at IS NULL;

ALTER TABLE public.employee_login_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) accesses this table.
