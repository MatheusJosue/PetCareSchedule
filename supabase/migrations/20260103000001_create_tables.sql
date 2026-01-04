-- Migration: Create all tables for Pet Care Schedule
-- Created: 2026-01-03

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('client', 'admin');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE plan_type AS ENUM ('avulso', 'semanal', 'mensal');
CREATE TYPE pet_size AS ENUM ('pequeno', 'medio', 'grande');
CREATE TYPE pet_species AS ENUM ('cachorro', 'gato', 'outro');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled');

-- ============================================
-- USERS TABLE (extends auth.users)
-- ============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- ============================================
-- PETS TABLE
-- ============================================

CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species pet_species NOT NULL DEFAULT 'cachorro',
  breed TEXT,
  size pet_size NOT NULL DEFAULT 'medio',
  birth_date DATE,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pets_user_id ON public.pets(user_id);

-- ============================================
-- SERVICES TABLE
-- ============================================

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL DEFAULT 60,
  base_price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_services_active ON public.services(active);

-- Insert default services
INSERT INTO public.services (name, description, duration_min, base_price, icon) VALUES
  ('Banho', 'Banho completo com shampoo e condicionador', 60, 60.00, 'droplet'),
  ('Tosa', 'Tosa completa conforme preferencia do cliente', 90, 80.00, 'scissors'),
  ('Banho + Tosa', 'Combo banho completo e tosa', 120, 120.00, 'sparkles'),
  ('Corte de Unhas', 'Corte e lixamento das unhas', 30, 30.00, 'scissors'),
  ('Limpeza de Ouvidos', 'Limpeza e higienizacao dos ouvidos', 20, 25.00, 'ear'),
  ('Hidratacao', 'Tratamento de hidratacao profunda dos pelos', 45, 50.00, 'droplets');

-- ============================================
-- PLANS TABLE
-- ============================================

CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type plan_type NOT NULL DEFAULT 'avulso',
  description TEXT,
  frequency TEXT,
  sessions_per_period INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_plans_active ON public.plans(active);

-- Insert default plans
INSERT INTO public.plans (name, type, description, frequency, sessions_per_period, price, discount_percent) VALUES
  ('Avulso', 'avulso', 'Pagamento por servico', NULL, 1, 0, 0),
  ('Plano Semanal', 'semanal', 'Um banho por semana', '1x por semana', 4, 200.00, 15),
  ('Plano Mensal', 'mensal', 'Dois banhos por mes', '2x por mes', 2, 100.00, 10);

-- ============================================
-- AVAILABILITY SLOTS TABLE
-- ============================================

CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  block_reason TEXT,
  max_appointments INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint to prevent duplicate slots
CREATE UNIQUE INDEX idx_availability_unique ON public.availability_slots(date, start_time);
CREATE INDEX idx_availability_date ON public.availability_slots(date);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  subscription_id UUID,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  admin_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES public.users(id),
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_pet_id ON public.appointments(pet_id);
CREATE INDEX idx_appointments_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_date_time ON public.appointments(scheduled_date, scheduled_time);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE,
  next_billing_date DATE,
  sessions_remaining INTEGER NOT NULL DEFAULT 0,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  status subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key to appointments after subscriptions is created
ALTER TABLE public.appointments
  ADD CONSTRAINT fk_appointments_subscription
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- ============================================
-- SETTINGS TABLE
-- ============================================

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
  ('business_hours', '{"start": "08:00", "end": "18:00", "days": [1,2,3,4,5,6]}', 'Horario de funcionamento'),
  ('slot_duration', '60', 'Duracao padrao do slot em minutos'),
  ('advance_booking_days', '30', 'Dias maximos de antecedencia para agendamento'),
  ('cancellation_policy_hours', '24', 'Horas minimas para cancelamento'),
  ('notification_email', '"admin@petcare.com"', 'Email para notificacoes'),
  ('company_name', '"Pet Care Schedule"', 'Nome da empresa'),
  ('company_phone', '"(11) 99999-9999"', 'Telefone da empresa');

-- ============================================
-- NOTIFICATIONS TABLE (for future use)
-- ============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
  p_date DATE,
  p_time TIME,
  p_duration_min INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_slot_exists BOOLEAN;
  v_is_blocked BOOLEAN;
  v_appointments_count INTEGER;
  v_max_appointments INTEGER;
BEGIN
  -- Check if slot exists and is not blocked
  SELECT EXISTS(
    SELECT 1 FROM public.availability_slots
    WHERE date = p_date
    AND start_time <= p_time
    AND end_time > p_time
    AND is_blocked = FALSE
  ) INTO v_slot_exists;

  IF NOT v_slot_exists THEN
    RETURN FALSE;
  END IF;

  -- Get max appointments for the slot
  SELECT max_appointments INTO v_max_appointments
  FROM public.availability_slots
  WHERE date = p_date
  AND start_time <= p_time
  AND end_time > p_time
  LIMIT 1;

  -- Count existing appointments
  SELECT COUNT(*) INTO v_appointments_count
  FROM public.appointments
  WHERE scheduled_date = p_date
  AND scheduled_time = p_time
  AND status NOT IN ('cancelled');

  RETURN v_appointments_count < COALESCE(v_max_appointments, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a date
CREATE OR REPLACE FUNCTION get_available_slots(p_date DATE)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.start_time,
    s.end_time,
    (
      SELECT COUNT(*) < s.max_appointments
      FROM public.appointments a
      WHERE a.scheduled_date = p_date
      AND a.scheduled_time = s.start_time
      AND a.status NOT IN ('cancelled')
    ) as available
  FROM public.availability_slots s
  WHERE s.date = p_date
  AND s.is_blocked = FALSE
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;
