-- Durable idempotency key for in-app notifications.
-- Apply this migration in Supabase before deploying code that passes event keys.
-- Existing notifications are preserved; NULL keys remain allowed.

BEGIN;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS event_key text;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_event_key_unique
  ON public.notifications (user_id, event_key)
  WHERE event_key IS NOT NULL;

COMMIT;
