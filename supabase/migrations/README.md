# Migration scope and prerequisites

The current ordered chain establishes the core identity/provider/booking schema, platform settings, and current-user-only administrator checks.

1. `20261029090000_core_schema.sql` — profiles, provider profiles, provider payment accounts, bookings, RLS, and role/provider guard triggers.
2. `20261029091000_admin_settings.sql` — platform settings and administrator-only policies.
3. `20261029092000_admin_check_hardening.sql` — booking-status preflight/constraint, policy recreation, and removal of the legacy arbitrary-UUID `is_admin(uuid)` function.

## Deliberate blocker: payment and notification schema

This is not yet the complete application schema. The legacy SQL files for payment outbox, provider earnings, and notification security depend on `public.payments` and/or `public.notifications`, but the repository's existing SQL source does not define those base tables or the complete payment state-transition function. Do not add the dependent scripts to the migration chain until the authoritative table definitions, enums, constraints, triggers, RPC signatures, grants, and RLS policies have been reconciled from a non-production schema export or reviewed source migration.

Do not link the local Supabase CLI to production or run `supabase db push` during reconstruction.
