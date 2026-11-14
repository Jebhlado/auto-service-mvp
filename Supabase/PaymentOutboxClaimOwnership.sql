
-- Payment processing outbox claim ownership.
-- Reconciled with the manually applied Supabase implementation.

BEGIN;

ALTER TABLE public.payment_processing_outbox
  ADD COLUMN IF NOT EXISTS claim_token uuid;

CREATE INDEX IF NOT EXISTS payment_processing_outbox_claim_idx
  ON public.payment_processing_outbox (available_at, created_at)
  WHERE status IN ('pending', 'processing');

CREATE OR REPLACE FUNCTION public.claim_payment_processing_outbox(
  p_payment_id uuid DEFAULT NULL
)
RETURNS SETOF public.payment_processing_outbox
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH candidate AS (
    SELECT o.id
    FROM public.payment_processing_outbox AS o
    WHERE o.status <> 'processed'
      AND o.available_at <= now()
      AND (
        o.status = 'pending'
        OR o.locked_until IS NULL
        OR o.locked_until < now()
      )
      AND (
        p_payment_id IS NULL
        OR o.payment_id = p_payment_id
      )
    ORDER BY o.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.payment_processing_outbox AS o
  SET status = 'processing',
      attempts = o.attempts + 1,
      locked_until = now() + interval '10 minutes',
      claim_token = gen_random_uuid(),
      last_error = NULL
  FROM candidate
  WHERE o.id = candidate.id
  RETURNING o.*;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_payment_processing_outbox(
  p_outbox_id uuid,
  p_claim_token uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.payment_processing_outbox
  SET status = 'processed',
      processed_at = now(),
      locked_until = NULL,
      claim_token = NULL,
      last_error = NULL
  WHERE id = p_outbox_id
    AND status = 'processing'
    AND claim_token = p_claim_token;

  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.retry_payment_processing_outbox(
  p_outbox_id uuid,
  p_claim_token uuid,
  p_available_at timestamptz,
  p_last_error text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.payment_processing_outbox
  SET status = 'pending',
      available_at = p_available_at,
      locked_until = NULL,
      claim_token = NULL,
      last_error = left(p_last_error, 2000)
  WHERE id = p_outbox_id
    AND status = 'processing'
    AND claim_token = p_claim_token;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION
  public.claim_payment_processing_outbox(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.claim_payment_processing_outbox(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION
  public.complete_payment_processing_outbox(uuid, uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.complete_payment_processing_outbox(uuid, uuid)
  TO service_role;

REVOKE ALL ON FUNCTION
  public.retry_payment_processing_outbox(uuid, uuid, timestamptz, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.retry_payment_processing_outbox(uuid, uuid, timestamptz, text)
  TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
