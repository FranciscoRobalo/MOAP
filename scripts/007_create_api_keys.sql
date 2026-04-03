-- Create API keys table for external access

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['read:materials', 'read:budgets'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can manage their own API keys
CREATE POLICY "Users can view their API keys" ON public.api_keys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create API keys" ON public.api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their API keys" ON public.api_keys
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their API keys" ON public.api_keys
  FOR DELETE USING (user_id = auth.uid());

-- Admins can manage all API keys
CREATE POLICY "Admins can manage all API keys" ON public.api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id);
