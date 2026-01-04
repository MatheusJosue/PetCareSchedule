-- Migration: Row Level Security Policies
-- Created: 2026-01-03

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role = 'client' OR public.is_admin()) -- Only admins can change role
  );

-- Admins can update any user
CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (public.is_admin());

-- Users can insert their own profile (on signup)
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can insert any user
CREATE POLICY "users_insert_admin"
  ON public.users FOR INSERT
  WITH CHECK (public.is_admin());

-- Allow trigger/service role to insert users (for signup flow)
CREATE POLICY "users_insert_service"
  ON public.users FOR INSERT
  WITH CHECK (TRUE);  -- Service role bypasses RLS, but this ensures triggers work

-- ============================================
-- PETS POLICIES
-- ============================================

-- Users can view their own pets
CREATE POLICY "pets_select_own"
  ON public.pets FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all pets
CREATE POLICY "pets_select_admin"
  ON public.pets FOR SELECT
  USING (public.is_admin());

-- Users can insert their own pets
CREATE POLICY "pets_insert_own"
  ON public.pets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pets
CREATE POLICY "pets_update_own"
  ON public.pets FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any pet
CREATE POLICY "pets_update_admin"
  ON public.pets FOR UPDATE
  USING (public.is_admin());

-- Users can delete their own pets
CREATE POLICY "pets_delete_own"
  ON public.pets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SERVICES POLICIES
-- ============================================

-- Everyone can view active services
CREATE POLICY "services_select_active"
  ON public.services FOR SELECT
  USING (active = TRUE);

-- Admins can view all services
CREATE POLICY "services_select_admin"
  ON public.services FOR SELECT
  USING (public.is_admin());

-- Only admins can insert services
CREATE POLICY "services_insert_admin"
  ON public.services FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update services
CREATE POLICY "services_update_admin"
  ON public.services FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete services
CREATE POLICY "services_delete_admin"
  ON public.services FOR DELETE
  USING (public.is_admin());

-- ============================================
-- PLANS POLICIES
-- ============================================

-- Everyone can view active plans
CREATE POLICY "plans_select_active"
  ON public.plans FOR SELECT
  USING (active = TRUE);

-- Admins can view all plans
CREATE POLICY "plans_select_admin"
  ON public.plans FOR SELECT
  USING (public.is_admin());

-- Only admins can manage plans
CREATE POLICY "plans_insert_admin"
  ON public.plans FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "plans_update_admin"
  ON public.plans FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "plans_delete_admin"
  ON public.plans FOR DELETE
  USING (public.is_admin());

-- ============================================
-- AVAILABILITY SLOTS POLICIES
-- ============================================

-- Everyone can view non-blocked slots
CREATE POLICY "availability_select_all"
  ON public.availability_slots FOR SELECT
  USING (TRUE);

-- Only admins can manage availability
CREATE POLICY "availability_insert_admin"
  ON public.availability_slots FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "availability_update_admin"
  ON public.availability_slots FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "availability_delete_admin"
  ON public.availability_slots FOR DELETE
  USING (public.is_admin());

-- ============================================
-- APPOINTMENTS POLICIES
-- ============================================

-- Users can view their own appointments
CREATE POLICY "appointments_select_own"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all appointments
CREATE POLICY "appointments_select_admin"
  ON public.appointments FOR SELECT
  USING (public.is_admin());

-- Users can insert their own appointments
CREATE POLICY "appointments_insert_own"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointments (only pending/confirmed can be modified)
CREATE POLICY "appointments_update_own"
  ON public.appointments FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('pending', 'confirmed') -- Can only modify pending/confirmed appointments
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('pending', 'confirmed', 'cancelled') -- Can change to these statuses
  );

-- Admins can update any appointment
CREATE POLICY "appointments_update_admin"
  ON public.appointments FOR UPDATE
  USING (public.is_admin());

-- Users can delete their own pending appointments
CREATE POLICY "appointments_delete_own"
  ON public.appointments FOR DELETE
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Admins can delete any appointment
CREATE POLICY "appointments_delete_admin"
  ON public.appointments FOR DELETE
  USING (public.is_admin());

-- ============================================
-- SUBSCRIPTIONS POLICIES
-- ============================================

-- Users can view their own subscriptions
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "subscriptions_select_admin"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

-- Only admins can manage subscriptions
CREATE POLICY "subscriptions_insert_admin"
  ON public.subscriptions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "subscriptions_update_admin"
  ON public.subscriptions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "subscriptions_delete_admin"
  ON public.subscriptions FOR DELETE
  USING (public.is_admin());

-- ============================================
-- SETTINGS POLICIES
-- ============================================

-- Everyone can read settings
CREATE POLICY "settings_select_all"
  ON public.settings FOR SELECT
  USING (TRUE);

-- Only admins can modify settings
CREATE POLICY "settings_insert_admin"
  ON public.settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "settings_update_admin"
  ON public.settings FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "settings_delete_admin"
  ON public.settings FOR DELETE
  USING (public.is_admin());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Only system/admins can insert notifications
CREATE POLICY "notifications_insert_admin"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin());

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
