-- MOAP Row Level Security Policies

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Everyone can view approved profiles
CREATE POLICY "profiles_select_approved" ON public.profiles
  FOR SELECT USING (approved = TRUE OR auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile (for approval)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- MATERIALS POLICIES
-- ============================================

-- Everyone can view materials (base prices)
CREATE POLICY "materials_select_all" ON public.materials
  FOR SELECT USING (TRUE);

-- Only admins can modify materials (including margins)
CREATE POLICY "materials_insert_admin" ON public.materials
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "materials_update_admin" ON public.materials
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "materials_delete_admin" ON public.materials
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- BUDGETS POLICIES
-- ============================================

-- Users can view their own budgets (only if visible_to_client or they're admin)
CREATE POLICY "budgets_select_own" ON public.budgets
  FOR SELECT USING (
    user_id = auth.uid() AND visible_to_client = TRUE
  );

-- Admins can view all budgets
CREATE POLICY "budgets_select_admin" ON public.budgets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert their own budgets
CREATE POLICY "budgets_insert_own" ON public.budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own draft budgets
CREATE POLICY "budgets_update_own_draft" ON public.budgets
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'rascunho'
  );

-- Admins can update any budget (for approval)
CREATE POLICY "budgets_update_admin" ON public.budgets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- BUDGET ITEMS POLICIES
-- ============================================

-- Users can view items of their visible budgets
CREATE POLICY "budget_items_select_own" ON public.budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.budgets 
      WHERE id = budget_items.budget_id 
      AND user_id = auth.uid() 
      AND visible_to_client = TRUE
    )
  );

-- Admins can view all budget items (including margin info)
CREATE POLICY "budget_items_select_admin" ON public.budget_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert items to their own budgets
CREATE POLICY "budget_items_insert_own" ON public.budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budgets 
      WHERE id = budget_items.budget_id 
      AND user_id = auth.uid()
    )
  );

-- Admins can update budget items (for margin adjustments)
CREATE POLICY "budget_items_update_admin" ON public.budget_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- CONVERSATIONS POLICIES
-- ============================================

-- Users can view their own conversations
CREATE POLICY "conversations_select_own" ON public.conversations
  FOR SELECT USING (
    participant_1 = auth.uid() OR participant_2 = auth.uid()
  );

-- Users can create conversations
CREATE POLICY "conversations_insert_own" ON public.conversations
  FOR INSERT WITH CHECK (
    participant_1 = auth.uid() OR participant_2 = auth.uid()
  );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in their conversations
CREATE POLICY "messages_select_own" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- Users can mark messages as read
CREATE POLICY "messages_update_read" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = messages.conversation_id 
      AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- System/Admin can create notifications for anyone
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
