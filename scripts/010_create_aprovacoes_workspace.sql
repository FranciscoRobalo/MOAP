-- Aprovações de Obras — Workspace schema
-- Stores per-user decision history, checklists, comments and reviewer assignments
-- for obras that (in the current product) live in the client-side data context.
-- Keyed by the client obra id as TEXT so it works today and keeps working when
-- obras migrate to Supabase.

CREATE TABLE IF NOT EXISTS public.obra_decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  obra_id          TEXT NOT NULL,
  obra_title       TEXT,
  previous_status  TEXT,
  new_status       TEXT NOT NULL,
  reason           TEXT,
  reviewer_id      UUID NULL REFERENCES public.profiles(id),
  reviewer_name    TEXT,
  author_name      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_obra_decisions_user_obra
  ON public.obra_decisions (user_id, obra_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.obra_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  obra_id     TEXT NOT NULL,
  author_name TEXT,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_obra_comments_user_obra
  ON public.obra_comments (user_id, obra_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.obra_checklist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  obra_id    TEXT NOT NULL,
  label      TEXT NOT NULL,
  is_done    BOOLEAN NOT NULL DEFAULT FALSE,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_obra_checklist_user_obra
  ON public.obra_checklist (user_id, obra_id, position);

CREATE TABLE IF NOT EXISTS public.obra_assignments (
  obra_id        TEXT PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id    UUID NULL REFERENCES public.profiles(id),
  reviewer_name  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_obra_assignments_user
  ON public.obra_assignments (user_id);

ALTER TABLE public.obra_decisions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_checklist   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "obra_decisions_all" ON public.obra_decisions;
CREATE POLICY "obra_decisions_all" ON public.obra_decisions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "obra_comments_all" ON public.obra_comments;
CREATE POLICY "obra_comments_all" ON public.obra_comments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "obra_checklist_all" ON public.obra_checklist;
CREATE POLICY "obra_checklist_all" ON public.obra_checklist
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "obra_assignments_all" ON public.obra_assignments;
CREATE POLICY "obra_assignments_all" ON public.obra_assignments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.aprovacoes_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_obra_checklist_touch ON public.obra_checklist;
CREATE TRIGGER trg_obra_checklist_touch BEFORE UPDATE ON public.obra_checklist
  FOR EACH ROW EXECUTE FUNCTION public.aprovacoes_touch_updated_at();

DROP TRIGGER IF EXISTS trg_obra_assignments_touch ON public.obra_assignments;
CREATE TRIGGER trg_obra_assignments_touch BEFORE UPDATE ON public.obra_assignments
  FOR EACH ROW EXECUTE FUNCTION public.aprovacoes_touch_updated_at();
