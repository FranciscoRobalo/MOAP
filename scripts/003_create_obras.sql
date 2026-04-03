-- Create obras (projects) table

CREATE TABLE IF NOT EXISTS public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_id UUID REFERENCES public.profiles(id),
  location TEXT,
  category TEXT DEFAULT 'Residencial',
  description TEXT,
  area TEXT,
  type TEXT, -- Construção Nova, Remodelação, Reabilitação
  budget DECIMAL(14, 2),
  start_date DATE,
  end_date DATE,
  timeline TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-analysis', 'approved', 'in-progress', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id), -- Tecnico assigned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

-- Clients can view their own obras
CREATE POLICY "Clients can view their own obras" ON public.obras
  FOR SELECT USING (
    client_id = auth.uid() OR created_by = auth.uid()
  );

-- Tecnicos can view assigned obras
CREATE POLICY "Tecnicos can view assigned obras" ON public.obras
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

-- Admins and tecnicos can view all obras
CREATE POLICY "Admins can view all obras" ON public.obras
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create obras
CREATE POLICY "Authenticated users can create obras" ON public.obras
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Admins and tecnicos can update any obra
CREATE POLICY "Admins and tecnicos can update obras" ON public.obras
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'tecnico')
    )
  );

-- Clients can update their own obras
CREATE POLICY "Clients can update their own obras" ON public.obras
  FOR UPDATE USING (client_id = auth.uid() OR created_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_obras_client ON public.obras(client_id);
CREATE INDEX IF NOT EXISTS idx_obras_status ON public.obras(status);
CREATE INDEX IF NOT EXISTS idx_obras_created_by ON public.obras(created_by);
