# AutoCare Connect — Known Issues and Verification Risks

Last consolidated: 2026-11-22

This file records issues and risks previously observed or reported. A finding is not necessarily a confirmed exploitable vulnerability. Re-check the current branch and live environment before remediation.

## 1. Critical database/security reconciliation

### K-001 — Booking table permissions and broad updates
Prior live Supabase review found authenticated users had broad SELECT/INSERT/UPDATE grants on bookings, including sensitive columns such as status, quote and timestamps. RLS policies included customer/provider/admin ownership rules, but broad column privileges and update paths require careful review.

**Required:** restrict writes to the minimum columns and permitted transitions; enforce server-side ownership/role checks; test direct PostgREST attempts for customers/providers/admins. Do not rely on UI restrictions.

### K-002 — Live schema and migration mismatch
Prior review found live RLS policies/grants differ from migration definitions; several local migrations were absent from the remote migration history. Standalone SQL files also exist outside the ordered migration chain.

**Required:** produce a read-only schema inventory; reconcile tables, columns, grants, RLS, policies, triggers, functions, indexes, constraints and migration history. Never blindly push/repair migrations or apply SQL to production.

### K-003 — Provider public visibility and activation state
A prior live provider profile SELECT policy allowed approved rows without checking `is_active`, while a public directory view filtered approved and active providers. This creates inconsistent access paths.

**Required:** define intended public/private data contract and ensure table grants, policies, view and application queries agree. Test anonymous and authenticated direct API access.

### K-004 — Missing/inconsistent triggers
Prior trigger inventory showed only `platform_settings_set_updated_at` and `provider_payment_accounts_set_updated_at`; expected role/provider guard triggers from migrations were not present in that inventory.

**Required:** compare live trigger/function inventory with application assumptions and intended migrations; test role escalation and provider approval tampering.

### K-005 — `is_admin(uuid)` overload
Prior live database had a SECURITY DEFINER `is_admin(uuid)` with fixed search path that ignored the supplied argument and checked `auth.uid()`; the migration expected a no-argument version and dropped the UUID overload.

**Required:** reconcile function signatures, execute grants, all policy call sites and safe semantics. Avoid arbitrary-user privilege probing. Test with anon/customer/provider/admin.

### K-006 — Provider profile field exposure
Prior review found a public directory view intended to expose safe fields and a `get_my_provider_profile()` SECURITY DEFINER function returning the caller's own profile. Column-level grants restricted sensitive contact/approval columns, but verify all views, functions, joins, server actions and API paths consistently.

**Required:** no public access to provider private contact/verification/approval metadata; public data only from an explicit allowlist.

## 2. Application authorization and workflow risks

### K-007 — Legacy and active booking actions
Prior code review identified multiple booking creation paths, including a legacy `app/provider/actions.ts` action and an active `app/providers/[providerId]/actions.ts` action. Verify whether legacy path remains callable and remove/secure dead or duplicate paths only after usage proof.

### K-008 — Privileged server actions
Customer/provider/admin actions use privileged server-side Supabase access for some operations. Each must authenticate, check role and ownership, validate input and constrain state transitions before using admin client.

### K-009 — Cancel booking API
Prior review of `app/api/cancel-booking/route.ts` noted admin client use, booking/customer/status lookup and update. Recheck authorization, UUID/input validation, notification failure isolation, and whether platform settings are fetched before authentication unnecessarily.

### K-010 — Booking/quote/review actions
Prior review identified admin-client use in customer quote/review/completion actions. Verify booking ownership, participant role, valid status, quote amount, duplicate reviews and notification isolation. Check review revalidation path consistency.

### K-011 — Upload validation
Active booking action previously accepted a MIME allowlist and 10MB limit and used UUID filenames. MIME alone is not proof of file content.

**Required:** validate magic bytes/signatures, actual size, type, quarantine/scan, storage policy, ownership and safe retrieval. Test malicious and malformed files.

### K-012 — Booking state transitions
Application and database status sets may differ. Code paths have used states including pending, confirmed, rejected, in_progress, completed, closed and cancelled.

**Required:** document one canonical state machine, enforce transitions in DB/server, test concurrency and ensure no client can directly set privileged statuses.

## 3. PayFast and payment outbox

### K-013 — RPC parity
Verify `transition_payment` and claim/complete/retry payment-outbox RPC names, parameters, return types, permissions, idempotency and lease semantics match the live database and `lib/payment-outbox.ts`.

### K-014 — PayFast ITN
Existing endpoint includes signature/merchant/amount/server validation and IP allowlist according to prior review. Recheck current code and test:
- invalid signature;
- wrong merchant;
- amount mismatch;
- duplicate/replayed ITN;
- out-of-order ITN;
- server validation failure;
- untrusted proxy/X-Forwarded-For handling;
- concurrent notifications;
- transient database/notification failure.

Do not assume the first X-Forwarded-For value is trustworthy without validating the hosting proxy chain and PayFast IP source.

### K-015 — Outbox retry/recovery
Prior endpoint `/api/cron/payment-outbox` uses Node runtime, CRON_SECRET, batch size 25 and maxDuration 60; `vercel.json` previously scheduled it daily at 03:00 UTC. Recheck live code, Vercel plan limits and environment config.

**Required:** alert on failed runs, growing outbox age, retry thresholds and stale claims; define maximum retries/dead-letter/manual review; test email-send/claim-completion failure windows.

### K-016 — Refunds, chargebacks and reconciliation
Final refund/reversal/chargeback policy and complete state-machine handling remain outstanding. Accountant/legal review required.

## 4. Deployment/build issue

### K-017 — Vercel deployment failures
Prior record: nine failed Production deployments on `work/security-hardening`. Earliest investigated failure showed TypeScript error in `app/customer/page.tsx` around `let customerBookings = []` due implicit any. The user noted the same line appeared in a successful deployment, so that alone did not explain all failures.

**Outstanding evidence:** exact Vercel build logs for commit `e2eeb9e` and source around customerBookings from that commit. Do not assume the root cause was resolved.

### K-018 — Unverified local type fix
A local change was reported to type `customerBookings` explicitly and cast `data ?? []` to `CustomerBooking[]`; no verified build result is recorded here.

### K-019 — Generated build metadata
`tsconfig.tsbuildinfo` was modified in the prior local tree. Treat as generated build metadata; do not include or overwrite casually.

## 5. Migration and local workspace safety

- Prior working branch: `work/security-hardening`; recheck before operations.
- Prior local modified files included:
  - `app/api/cancel-booking/route.ts`
  - `app/customer/actions.ts`
  - `app/customer/page.tsx`
  - `app/provider/[id]/page.tsx`
  - `app/provider/actions.ts`
  - `supabase/migrations/20261117090000_provider_public_data_privacy.sql`
  - `tsconfig.tsbuildinfo`
- Prior stash contained `tsconfig.tsbuildinfo` and untracked SQL snippets:
  - `Supabase/snippets/Untitled query 692.sql`
  - `Supabase/snippets/Untitled query 692.sql.backup`

This is a historical snapshot. Inspect current Git status and stash list before touching local files. Never drop/overwrite the stash or apply SQL without explicit approval.

## 6. Production and legal readiness gaps

- Production database schema/migration baseline not yet evidenced as reproducible.
- Full role/RLS direct API security regression suite not yet evidenced.
- PayFast/outbox end-to-end sandbox and recovery evidence not yet complete.
- Independent security assessment and retesting not yet signed off.
- Monitoring, error tracking, structured logs and actionable alerts need evidence.
- Backup restoration drills need evidence.
- Account deletion and data export need implementation/testing evidence.
- Mobile, accessibility and Lighthouse/performance reviews need evidence.
- POPIA/PAIA applicability, Information Officer obligations, privacy notices, retention, processor terms and cross-border handling require professional review.
- Provider Agreement, Customer Protection/Warranty Policy, refund/dispute policy and provider verification standards require completion and review.
- Company registration, IP assignment, trademark/domain checks, business banking and PayFast merchant onboarding remain outstanding at last recorded update.
- Support Centre and business continuity/disaster recovery require implementation and exercise evidence.
- Footer and final brand review remain outstanding.
- Cloudflare R2 archive choice, costs, data location and POPIA implications require verification.
- WhatsApp critical/high alert vendor and costs require research.

## 7. Immediate audit order

1. Confirm current Git branch/status and protect uncommitted/stashed work.
2. Confirm exact deployed commit and Vercel environment.
3. Read-only Supabase schema/grant/RLS/function/trigger inventory.
4. Reconcile booking and profile authorization, direct PostgREST negative tests.
5. Audit every sensitive server action/API route and remove unsafe legacy paths only with evidence.
6. Reconcile PayFast transition/outbox RPCs and test sandbox idempotency/recovery.
7. Run authorised staging penetration tests and record findings/remediation/retest.
8. Build reproducible migration baseline and tests before any production change.
9. Complete production/legal/business launch gates in FEATURE_STATUS.md.
