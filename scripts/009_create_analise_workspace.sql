-- Análise de Orçamentos — Workspace schema (v2, profile-referenced)
-- Persistent storage for saved analyses, per-item decisions,
-- notes and AI-generated negotiation scripts. Rows owned by the
-- authenticated user via RLS, mirroring the existing scripts pattern.

-- =======================================================
-- Saved analyses (snapshots)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.analise_saved (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  obra_id            UUID NULL,
  file_name          TEXT NOT NULL,
  region             TEXT,
  total_budget       NUMERIC,
  total_reference    NUMERIC,
  overall_variance   NUMERIC,
  overall_rating     TEXT,
  quality_score      NUMERIC,
  match_rate         NUMERIC,
  potential_savings  NUMERIC,
  risk_items         INT,
  stats              JSONB,
  category_breakdown JSONB,
  recommendations    JSONB,
  items              JSONB NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analise_saved_user_created
  ON public.analise_saved (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analise_saved_obra
  ON public.analise_saved (obra_id);

-- =======================================================
-- Per-item decisions (accepted / negotiate / rejected)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.analise_decisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_id  UUID NOT NULL REFERENCES public.analise_saved(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL,
  decision     TEXT NOT NULL DEFAULT 'pending',
  target_price NUMERIC NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (analysis_id, item_id)
);

ALTER TABLE public.analise_decisions
  DROP CONSTRAINT IF EXISTS analise_decisions_decision_check;

ALTER TABLE public.analise_decisions
  ADD CONSTRAINT analise_decisions_decision_check
  CHECK (decision IN ('pending','accepted','negotiate','rejected'));

CREATE INDEX IF NOT EXISTS idx_analise_decisions_analysis
  ON public.analise_decisions (analysis_id);

-- =======================================================
-- Per-item notes
-- =======================================================
CREATE TABLE IF NOT EXISTS public.analise_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.analise_saved(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analise_notes_analysis_item
  ON public.analise_notes (analysis_id, item_id, created_at DESC);

-- =======================================================
-- AI negotiation scripts (cached per item)
-- =======================================================
CREATE TABLE IF NOT EXISTS public.analise_scripts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_id UUID NOT NULL REFERENCES public.analise_saved(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  script      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analise_scripts_analysis_item
  ON public.analise_scripts (analysis_id, item_id, created_at DESC);

-- =======================================================
-- RLS
-- =======================================================
ALTER TABLE public.analise_saved     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analise_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analise_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analise_scripts   ENABLE ROW LEVEL SECURITY;

-- analise_saved policies
DROP POLICY IF EXISTS "analise_saved_select" ON public.analise_saved;
CREATE POLICY "analise_saved_select" ON public.analise_saved
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "analise_saved_insert" ON public.analise_saved;
CREATE POLICY "analise_saved_insert" ON public.analise_saved
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "analise_saved_update" ON public.analise_saved;
CREATE POLICY "analise_saved_update" ON public.analise_saved
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "analise_saved_delete" ON public.analise_saved;
CREATE POLICY "analise_saved_delete" ON public.analise_saved
  FOR DELETE USING (user_id = auth.uid());

-- analise_decisions policies
DROP POLICY IF EXISTS "analise_decisions_all" ON public.analise_decisions;
CREATE POLICY "analise_decisions_all" ON public.analise_decisions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- analise_notes policies
DROP POLICY IF EXISTS "analise_notes_all" ON public.analise_notes;
CREATE POLICY "analise_notes_all" ON public.analise_notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- analise_scripts policies
DROP POLICY IF EXISTS "analise_scripts_all" ON public.analise_scripts;
CREATE POLICY "analise_scripts_all" ON public.analise_scripts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =======================================================
-- Updated-at trigger
-- =======================================================
CREATE OR REPLACE FUNCTION public.analise_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_analise_saved_touch ON public.analise_saved;
CREATE TRIGGER trg_analise_saved_touch
  BEFORE UPDATE ON public.analise_saved
  FOR EACH ROW EXECUTE FUNCTION public.analise_touch_updated_at();

DROP TRIGGER IF EXISTS trg_analise_decisions_touch ON public.analise_decisions;
CREATE TRIGGER trg_analise_decisions_touch
  BEFORE UPDATE ON public.analise_decisions
  FOR EACH ROW EXECUTE FUNCTION public.analise_touch_updated_at();
