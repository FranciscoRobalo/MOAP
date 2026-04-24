-- Extend analise_saved with a full submission → admin review → client feedback workflow.
-- Adds columns, a status check, an admin-visibility RLS policy, and a write-policy
-- that only admins can satisfy.

ALTER TABLE public.analise_saved
  ADD COLUMN IF NOT EXISTS submission_status     TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS submitted_at          TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reviewer_id           UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewer_name         TEXT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at           TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS admin_summary         TEXT NULL,
  ADD COLUMN IF NOT EXISTS admin_feedback        TEXT NULL,
  ADD COLUMN IF NOT EXISTS admin_revised_items   JSONB NULL,
  ADD COLUMN IF NOT EXISTS admin_revised_total   NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS admin_ai_notes        JSONB NULL,
  ADD COLUMN IF NOT EXISTS client_seen_at        TIMESTAMPTZ NULL;

ALTER TABLE public.analise_saved DROP CONSTRAINT IF EXISTS analise_saved_submission_status_check;
ALTER TABLE public.analise_saved
  ADD CONSTRAINT analise_saved_submission_status_check
  CHECK (submission_status IN ('draft','submitted','in_review','approved','changes_requested','rejected'));

CREATE INDEX IF NOT EXISTS idx_analise_saved_submission_status
  ON public.analise_saved (submission_status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_analise_saved_reviewer
  ON public.analise_saved (reviewer_id);

-- --------------------------------------------------------------------------
-- Admin RLS: admins can SELECT and UPDATE any analise_saved row whose status
-- is in the review pipeline (submitted / in_review / ...). Drafts stay private.
-- Owners retain full access via the existing policies.
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "analise_saved_admin_select" ON public.analise_saved;
CREATE POLICY "analise_saved_admin_select" ON public.analise_saved
  FOR SELECT USING (
    submission_status <> 'draft'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "analise_saved_admin_update" ON public.analise_saved;
CREATE POLICY "analise_saved_admin_update" ON public.analise_saved
  FOR UPDATE USING (
    submission_status <> 'draft'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- --------------------------------------------------------------------------
-- analise_admin_events: append-only audit log of every admin action on a
-- submission. Visible to the submission owner (read-only) and to admins.
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analise_admin_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id    UUID NOT NULL REFERENCES public.analise_saved(id) ON DELETE CASCADE,
  owner_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id       UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name     TEXT,
  action         TEXT NOT NULL,
  old_status     TEXT,
  new_status     TEXT,
  note           TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analise_admin_events_analysis
  ON public.analise_admin_events (analysis_id, created_at DESC);

ALTER TABLE public.analise_admin_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analise_admin_events_owner_select" ON public.analise_admin_events;
CREATE POLICY "analise_admin_events_owner_select" ON public.analise_admin_events
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "analise_admin_events_admin_all" ON public.analise_admin_events;
CREATE POLICY "analise_admin_events_admin_all" ON public.analise_admin_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
