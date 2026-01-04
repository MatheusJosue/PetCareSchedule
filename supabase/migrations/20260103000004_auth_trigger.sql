-- Migration: Auth Trigger for User Creation
-- Created: 2026-01-03

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run after user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GENERATE AVAILABILITY SLOTS
-- ============================================

-- Function to generate availability slots for a month
CREATE OR REPLACE FUNCTION public.generate_availability_slots(
  p_start_date DATE,
  p_end_date DATE,
  p_start_time TIME DEFAULT '08:00',
  p_end_time TIME DEFAULT '18:00',
  p_slot_duration INTEGER DEFAULT 60 -- minutes
)
RETURNS INTEGER AS $$
DECLARE
  v_current_date DATE;
  v_current_time TIME;
  v_slots_created INTEGER := 0;
  v_day_of_week INTEGER;
BEGIN
  v_current_date := p_start_date;

  WHILE v_current_date <= p_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_current_date);

    -- Skip Sundays (0) by default
    IF v_day_of_week != 0 THEN
      v_current_time := p_start_time;

      WHILE v_current_time < p_end_time LOOP
        INSERT INTO public.availability_slots (date, start_time, end_time, max_appointments)
        VALUES (
          v_current_date,
          v_current_time,
          v_current_time + (p_slot_duration || ' minutes')::INTERVAL,
          1
        )
        ON CONFLICT (date, start_time) DO NOTHING;

        v_current_time := v_current_time + (p_slot_duration || ' minutes')::INTERVAL;
        v_slots_created := v_slots_created + 1;
      END LOOP;
    END IF;

    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;

  RETURN v_slots_created;
END;
$$ LANGUAGE plpgsql;

-- Generate slots for the next 30 days
SELECT public.generate_availability_slots(
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '30 days')::DATE
);

-- ============================================
-- APPOINTMENT NOTIFICATION TRIGGER
-- ============================================

-- Function to create notification when appointment status changes
CREATE OR REPLACE FUNCTION public.notify_appointment_change()
RETURNS TRIGGER AS $$
DECLARE
  v_pet_name TEXT;
  v_service_name TEXT;
  v_message TEXT;
BEGIN
  -- Get pet and service names
  SELECT name INTO v_pet_name FROM public.pets WHERE id = NEW.pet_id;
  SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;

  -- Create notification based on status change
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    v_message := 'Seu agendamento de ' || v_service_name || ' para ' || v_pet_name ||
                 ' em ' || to_char(NEW.scheduled_date, 'DD/MM/YYYY') ||
                 ' às ' || to_char(NEW.scheduled_time, 'HH24:MI') || ' foi confirmado!';

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'appointment_confirmed',
      'Agendamento Confirmado',
      v_message,
      jsonb_build_object('appointment_id', NEW.id)
    );
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    v_message := 'Seu agendamento de ' || v_service_name || ' para ' || v_pet_name ||
                 ' em ' || to_char(NEW.scheduled_date, 'DD/MM/YYYY') || ' foi cancelado.';

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'appointment_cancelled',
      'Agendamento Cancelado',
      v_message,
      jsonb_build_object('appointment_id', NEW.id)
    );
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_message := 'O serviço de ' || v_service_name || ' para ' || v_pet_name || ' foi concluído!';

    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'appointment_completed',
      'Serviço Concluído',
      v_message,
      jsonb_build_object('appointment_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for appointment notifications
DROP TRIGGER IF EXISTS on_appointment_status_change ON public.appointments;
CREATE TRIGGER on_appointment_status_change
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_appointment_change();

-- ============================================
-- SUBSCRIPTION MANAGEMENT
-- ============================================

-- Function to use a session from subscription
CREATE OR REPLACE FUNCTION public.use_subscription_session(p_subscription_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sessions_remaining INTEGER;
BEGIN
  SELECT sessions_remaining INTO v_sessions_remaining
  FROM public.subscriptions
  WHERE id = p_subscription_id
  AND status = 'active';

  IF v_sessions_remaining IS NULL OR v_sessions_remaining <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE public.subscriptions
  SET
    sessions_remaining = sessions_remaining - 1,
    sessions_used = sessions_used + 1,
    updated_at = NOW()
  WHERE id = p_subscription_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
