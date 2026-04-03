-- Create materials and services reference table
-- This is the reference price database for budget analysis

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT NOT NULL,
  min_price DECIMAL(12, 2),
  avg_price DECIMAL(12, 2) NOT NULL,
  max_price DECIMAL(12, 2),
  supplier TEXT,
  region TEXT DEFAULT 'Portugal',
  description TEXT,
  keywords TEXT[], -- For better search matching
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Everyone can read materials (reference data)
CREATE POLICY "Anyone can view materials" ON public.materials
  FOR SELECT TO authenticated USING (true);

-- Only admins and tecnicos can insert/update materials
CREATE POLICY "Admins and tecnicos can insert materials" ON public.materials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

CREATE POLICY "Admins and tecnicos can update materials" ON public.materials
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

CREATE POLICY "Admins can delete materials" ON public.materials
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for search
CREATE INDEX IF NOT EXISTS idx_materials_name ON public.materials USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_keywords ON public.materials USING gin(keywords);
