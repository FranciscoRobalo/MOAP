-- Visitas table — scheduled site visits for an obra
CREATE TABLE IF NOT EXISTS public.visitas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  obra_id         UUID NULL REFERENCES public.obras(id) ON DELETE SET NULL,
  obra_name       TEXT,
  visit_date      DATE NOT NULL,
  visit_time      TEXT,
  type            TEXT,
  contact_name    TEXT,
  contact_phone   TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'agendada',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.visitas DROP CONSTRAINT IF EXISTS visitas_status_check;
ALTER TABLE public.visitas
  ADD CONSTRAINT visitas_status_check
  CHECK (status IN ('agendada','realizada','cancelada'));

CREATE INDEX IF NOT EXISTS idx_visitas_user_date
  ON public.visitas (user_id, visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_visitas_obra
  ON public.visitas (obra_id);

ALTER TABLE public.visitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitas_all" ON public.visitas;
CREATE POLICY "visitas_all" ON public.visitas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.visitas_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_visitas_touch ON public.visitas;
CREATE TRIGGER trg_visitas_touch
  BEFORE UPDATE ON public.visitas
  FOR EACH ROW EXECUTE FUNCTION public.visitas_touch_updated_at();
