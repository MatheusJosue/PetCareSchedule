-- ============================================
-- SUBSCRIPTION PAYMENT TRACKING
-- ============================================

-- Add payment tracking fields to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS payment_due_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS extra_sessions_used INTEGER NOT NULL DEFAULT 0;

-- payment_status can be: 'paid', 'pending', 'overdue'
-- payment_due_amount: amount owed for extra sessions
-- last_payment_date: when the last payment was made
-- extra_sessions_used: sessions used beyond the plan limit

-- Create index for payment status
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status ON public.subscriptions(payment_status);

-- Function to check if user can book based on subscription
CREATE OR REPLACE FUNCTION public.can_user_book(p_user_id UUID)
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
BEGIN
  -- Get user's active subscription
  SELECT s.*, p.sessions_per_period, p.type as plan_type
  INTO v_subscription
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

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
