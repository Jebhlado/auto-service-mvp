-- Durable outbox for post-payment work.
-- The trigger inserts the outbox event in the same transaction that marks a payment paid.

BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_processing_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'payment_confirmed',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'processed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT payment_processing_outbox_payment_event_unique
    UNIQUE (payment_id, event_type)
);

CREATE INDEX IF NOT EXISTS payment_processing_outbox_pending_idx
  ON public.payment_processing_outbox (available_at, created_at)
  WHERE status <> 'processed';

ALTER TABLE public.payment_processing_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_processing_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_processing_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_paid_payment_outbox()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.payment_processing_outbox (payment_id, event_type)
    VALUES (NEW.id, 'payment_confirmed')
    ON CONFLICT (payment_id, event_type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_enqueue_paid_outbox ON public.payments;
CREATE TRIGGER payments_enqueue_paid_outbox
AFTER UPDATE OF status ON public.payments
FOR EACH ROW
WHEN (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid')
EXECUTE FUNCTION public.enqueue_paid_payment_outbox();

CREATE OR REPLACE FUNCTION public.claim_payment_processing_outbox(p_payment_id uuid DEFAULT NULL)
RETURNS SETOF public.payment_processing_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT id
    FROM public.payment_processing_outbox
    WHERE status <> 'processed'
      AND available_at <= now()
      AND (status = 'pending' OR locked_until IS NULL OR locked_until < now())
      AND (p_payment_id IS NULL OR payment_id = p_payment_id)
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.payment_processing_outbox AS outbox
  SET status = 'processing',
      attempts = outbox.attempts + 1,
      locked_until = now() + interval '2 minutes',
      last_error = NULL
  FROM candidate
  WHERE outbox.id = candidate.id
  RETURNING outbox.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_payment_processing_outbox(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_processing_outbox(uuid) TO service_role;

COMMIT;
