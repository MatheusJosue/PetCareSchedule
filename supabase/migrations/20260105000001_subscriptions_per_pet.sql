-- ============================================
-- SUBSCRIPTIONS PER PET
-- ============================================

-- Add pet_id column to subscriptions table
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE;

-- Create index for pet_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_pet_id ON public.subscriptions(pet_id);

-- Update can_user_book function to check subscriptions per pet
CREATE OR REPLACE FUNCTION public.can_user_book(p_user_id UUID, p_pet_id UUID DEFAULT NULL)
RETURNS TABLE (
  can_book BOOLEAN,
  reason TEXT,
  subscription_id UUID,
  sessions_remaining INTEGER,
  payment_status TEXT,
  payment_due_amount DECIMAL
) AS $$
DECLARE
  v_subscription RECORD;
  v_pet_subscriptions RECORD;
BEGIN
  -- If pet_id is provided, check that specific pet's subscription
  IF p_pet_id IS NOT NULL THEN
    SELECT s.*, p.sessions_per_period, p.type as plan_type
    INTO v_subscription
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.pet_id = p_pet_id
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
  ELSE
    -- No pet specified - check if user has any active subscription
    -- This is used for general checking
    SELECT s.*, p.sessions_per_period, p.type as plan_type
    INTO v_subscription
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.user_id = p_user_id
      AND s.pet_id IS NULL
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  -- No active subscription - can book as avulso (pay per service)
  IF v_subscription IS NULL THEN
    RETURN QUERY SELECT
      TRUE,
      'Sem plano ativo - pagamento avulso'::TEXT,
      NULL::UUID,
      0,
      'paid'::TEXT,
      0::DECIMAL;
    RETURN;
  END IF;

  -- Has unpaid amount - cannot book
  IF v_subscription.payment_status IN ('pending', 'overdue') AND v_subscription.payment_due_amount > 0 THEN
    RETURN QUERY SELECT
      FALSE,
      'Pagamento pendente de R$ ' || v_subscription.payment_due_amount::TEXT,
      v_subscription.id,
      v_subscription.sessions_remaining,
      v_subscription.payment_status,
      v_subscription.payment_due_amount;
    RETURN;
  END IF;

  -- Has sessions remaining - can book
  IF v_subscription.sessions_remaining > 0 THEN
    RETURN QUERY SELECT
      TRUE,
      'Sessões disponíveis: ' || v_subscription.sessions_remaining::TEXT,
      v_subscription.id,
      v_subscription.sessions_remaining,
      v_subscription.payment_status,
      v_subscription.payment_due_amount;
    RETURN;
  END IF;

  -- No sessions remaining - can book but will be charged extra
  RETURN QUERY SELECT
    TRUE,
    'Sessões esgotadas - será cobrado valor adicional'::TEXT,
    v_subscription.id,
    0,
    v_subscription.payment_status,
    v_subscription.payment_due_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use a session from subscription
CREATE OR REPLACE FUNCTION public.use_subscription_session(
  p_subscription_id UUID,
  p_extra_charge DECIMAL DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE id = p_subscription_id;

  IF v_subscription IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_subscription.sessions_remaining > 0 THEN
    -- Use a regular session
    UPDATE public.subscriptions
    SET
      sessions_remaining = sessions_remaining - 1,
      sessions_used = sessions_used + 1,
      updated_at = NOW()
    WHERE id = p_subscription_id;
  ELSE
    -- Using extra session - add to payment due
    UPDATE public.subscriptions
    SET
      extra_sessions_used = extra_sessions_used + 1,
      payment_due_amount = payment_due_amount + p_extra_charge,
      payment_status = 'pending',
      updated_at = NOW()
    WHERE id = p_subscription_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark subscription as paid
CREATE OR REPLACE FUNCTION public.mark_subscription_paid(
  p_subscription_id UUID,
  p_renew_sessions BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
BEGIN
  SELECT s.*, p.sessions_per_period
  INTO v_subscription
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.id = p_subscription_id;

  IF v_subscription IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.subscriptions
  SET
    payment_status = 'paid',
    payment_due_amount = 0,
    last_payment_date = CURRENT_DATE,
    extra_sessions_used = 0,
    -- Optionally renew sessions
    sessions_remaining = CASE WHEN p_renew_sessions THEN v_subscription.sessions_per_period ELSE sessions_remaining END,
    sessions_used = CASE WHEN p_renew_sessions THEN 0 ELSE sessions_used END,
    updated_at = NOW()
  WHERE id = p_subscription_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
