-- Create budgets and budget_items tables
-- Stores uploaded client budgets for analysis

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_analise', 'analisado', 'aprovado', 'rejeitado')),
  total_value DECIMAL(14, 2),
  total_items INTEGER DEFAULT 0,
  analysis_score DECIMAL(5, 2), -- Quality score from analysis
  analysis_date TIMESTAMPTZ,
  analyzed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  file_url TEXT, -- Original uploaded file
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget items (individual line items from uploaded budgets)
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL, -- Name from uploaded document
  matched_material_id UUID REFERENCES public.materials(id),
  matched_name TEXT, -- Matched reference name
  match_confidence DECIMAL(5, 4) DEFAULT 0, -- 0 to 1
  quantity DECIMAL(12, 4),
  unit TEXT,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(14, 2),
  reference_avg_price DECIMAL(12, 2),
  reference_min_price DECIMAL(12, 2),
  reference_max_price DECIMAL(12, 2),
  variance DECIMAL(8, 2), -- Percentage variance from reference
  rating TEXT CHECK (rating IN ('below', 'average', 'above', 'critical', 'unknown')),
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Budget policies
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Admins and tecnicos can view all budgets" ON public.budgets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

CREATE POLICY "Users can create budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins and tecnicos can update budgets" ON public.budgets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (uploaded_by = auth.uid());

-- Budget items policies
CREATE POLICY "Users can view budget items for their budgets" ON public.budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.budgets
      WHERE budgets.id = budget_items.budget_id AND budgets.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Admins and tecnicos can view all budget items" ON public.budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

CREATE POLICY "Users can insert budget items" ON public.budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets
      WHERE budgets.id = budget_items.budget_id AND budgets.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Admins and tecnicos can insert budget items" ON public.budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

CREATE POLICY "Admins and tecnicos can update budget items" ON public.budget_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_obra ON public.budgets(obra_id);
CREATE INDEX IF NOT EXISTS idx_budgets_uploaded_by ON public.budgets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON public.budget_items(budget_id);
