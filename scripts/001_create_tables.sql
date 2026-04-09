-- MOAP Database Schema
-- This script creates all necessary tables for the MOAP platform

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'tecnico', 'cliente')),
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  approved BOOLEAN DEFAULT FALSE, -- Admin must approve new registrations
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Materials table with admin margin
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  price_max DECIMAL(12,2),
  admin_margin DECIMAL(5,2) DEFAULT 0, -- Percentage margin added by admin (hidden from clients)
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('material', 'work')),
  region TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budgets table with approval workflow
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  obra_name TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('rascunho', 'pendente', 'aprovado', 'rejeitado', 'finalizado')),
  total_value DECIMAL(12,2),
  analysis_variance DECIMAL(5,2),
  -- Admin approval fields
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  admin_notes TEXT,
  -- Visibility: only show to client after admin approval
  visible_to_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budget items with margin tracking
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id),
  material_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  -- Admin margin fields (hidden from clients)
  admin_margin_percent DECIMAL(5,2) DEFAULT 0,
  admin_margin_value DECIMAL(12,2) DEFAULT 0,
  final_price_with_margin DECIMAL(12,2), -- Price shown to admin only
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

-- 6. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('obra', 'message', 'budget', 'visit', 'concurso', 'system', 'approval')),
  title TEXT NOT NULL,
  description TEXT,
  read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON public.profiles(approved);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_visible ON public.budgets(visible_to_client);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
