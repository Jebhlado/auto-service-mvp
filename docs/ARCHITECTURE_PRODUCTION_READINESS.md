# Architecture and Production Readiness Review

Review date: 2026-10-29  
Repository: `Jebhlado/auto-service-mvp`  
Review branch: `fix/critical-schema-security`  
Review PR: [#3](https://github.com/Jebhlado/auto-service-mvp/pull/3)  
Environment rule: production Supabase remains read-only during this review. No production SQL has been applied.

## Executive decision

**Status: NOT APPROVED FOR PRODUCTION RELEASE.**

The latest GitHub commit status reports a successful Vercel check, but this is not equivalent to production acceptance. Payment processing, database authorization, schema reproducibility, recovery operations, backup restoration, and POPIA/PAIA operational controls still need evidence.

## Architecture findings

### P0 — Profile role and provider approval authorization
**State:** Remediation in PR #3; not yet fully verified.

- Profile role assignment must be protected at the database boundary, not only by hiding form options.
- Provider-owned requests must not change `approval_status`, `is_active`, or `approved_at`.
- Verify every admin server action and API route performs server-side authentication and authorization.
- Verify authenticated users cannot use direct PostgREST writes to elevate roles, approve providers, modify other users' bookings, or read another customer's private data.
- Regression tests must cover customer, provider, admin, anonymous, and service-role behavior.
- Review `public.is_admin(uuid)`: its argument permits callers with EXECUTE permission to probe whether an arbitrary UUID belongs to an admin. Consider removing the arbitrary-user argument or restricting it to the caller, while preserving the public provider-list policy safely.

### P0 — Production schema and migration safety
**State:** No ordered migration baseline exists yet.

- Reconcile production tables, constraints, triggers, grants, RLS policies, indexes, and RPC signatures against the repository.
- Use ordered migrations under `supabase/migrations/`; keep legacy SQL scripts as source material, not as a migration runner.
- Test the complete migration chain on an empty disposable local database and separately against a production-like data copy.
- Make migration preconditions fail clearly if required tables, columns, or existing status values differ.
- Confirm booking status transitions in application code and SQL agree.
- Do not link the local CLI to the production Supabase project or run `db push` against production during reconstruction.

### P0 — Payment state integrity and idempotency
**State:** Partial design exists; end-to-end proof pending.

- Verify `transition_payment` parameters and every state transition against the live database definition.
- Verify claim, completion, and retry outbox RPCs exist with the exact names, arguments, return values, permissions, and lease semantics used by `lib/payment-outbox.ts`.
- Test duplicate PayFast ITNs, out-of-order ITNs, amount mismatch, invalid signature, server-validation failure, transient Supabase/email failures, expired claim leases, and simultaneous workers.
- Verify email idempotency remains effective when a worker sends an email but loses its claim before completing the outbox row.
- Introduce an explicit maximum retry policy or dead-letter/manual-review state for poison events; unbounded retries with a capped delay can leave persistent failures unresolved indefinitely.
- Verify refund, dispute, chargeback, and reversal behavior before treating the payment state machine as complete.

### P1 — Scheduled recovery and Vercel runtime
**State:** Review required.

- Current `vercel.json` schedules `/api/cron/payment-outbox` at `0 3 * * *` (once per day, UTC).
- Confirm the Vercel plan's permitted cron frequency before changing the schedule. Target recovery should be frequent enough for the product's payment-notification expectations and the plan's limits.
- Confirm `CRON_SECRET` is set in the correct Vercel environments and the cron endpoint rejects missing/incorrect credentials.
- Keep the endpoint on the Node.js runtime and within the configured maximum duration.
- Add alerting for non-200/207 responses, repeated failures, outbox age/attempt thresholds, and jobs that have stopped running.
- Validate preview and production environment variables separately; do not assume they target the same Supabase project.

### P1 — Authentication and session handling
**State:** Partial implementation exists.

- Continue using server-validated Supabase identity, not user-supplied IDs or client-side role claims, for sensitive actions.
- Audit each server action and API route for ownership checks and role checks.
- Avoid broad `select("*")` in shared auth helpers when only a few fields are needed.
- Define a recoverable signup path when the Auth user exists but profile/provider-profile initialization fails.
- Ensure provider approval is enforced in provider discovery and booking creation, not just in the UI.

### P1 — Observability, backup, and incident response
**State:** Not yet evidenced as production-ready.

- Add structured, privacy-conscious logs with correlation IDs for booking/payment/outbox flows.
- Do not log secrets, authorization headers, full payment payloads, or unnecessary personal information.
- Configure error monitoring and actionable alerts for PayFast validation failures, RPC errors, retry exhaustion, and cron failures.
- Confirm automated backups are enabled for the production Supabase plan and perform a documented restore drill to a non-production project.
- Document incident triage, payment reconciliation, rollback, recovery, and disaster-recovery ownership.
- Keep a tested rollback path for application deployments and forward-only/compensating database migrations.

## Build and code-quality gate

Run against the exact candidate commit, not an earlier branch revision:

1. `npm ci`
2. `npm run lint`
3. `npx tsc --noEmit` (or `npm run typecheck`)
4. `npm run build`
5. Unit/integration tests for role guards, payment transitions, outbox idempotency, and booking lifecycle.
6. Playwright end-to-end checks for signup/login, provider approval, booking, quote acceptance, PayFast sandbox payment, and customer completion confirmation.
7. Security regression checks for direct PostgREST role escalation and cross-user access.

The current package script uses `next lint` with Next.js 15 and ESLint 9. Verify that command on the actual installed dependency tree; if unsupported, migrate to an explicit ESLint CLI/configuration without downgrading Next.js.

## Performance, mobile, and accessibility gate

- Check common viewport widths: 320, 375, 390, 768, 1024, and 1440 px.
- Test keyboard-only navigation, visible focus, form labels, contrast, screen-reader semantics, and touch-target sizing.
- Run Lighthouse on public, customer, provider, and admin routes; review LCP, INP, CLS, and accessibility findings.
- Profile expensive Supabase reads, add pagination where lists can grow, and add indexes only after query-plan evidence.
- Confirm media uploads have type/size limits, private storage policies where appropriate, and signed URLs or authorization checks for sensitive files.

## POPIA / PAIA and legal readiness

Before production approval:

- Verify a privacy notice explains purposes, lawful basis, data recipients/processors, retention, security safeguards, and data-subject rights.
- Document data minimization and retention periods for profiles, bookings, attachments, payment events, logs, and notifications.
- Implement and test account deletion and data export workflows, including handling records that must be retained for legal/accounting purposes.
- Confirm the PAIA manual and required contact/Information Officer details are accurate for the responsible entity.
- Review processor agreements and cross-border data handling for Supabase, Vercel, email delivery, and payment services.
- Maintain an incident/breach response procedure and a documented escalation path.
- Review the Privacy Policy, Terms and Conditions, Cookie Policy, Disclaimer, PAIA Manual, Security Policy, Data Retention Policy, and Incident Response Procedure.

## Release gates

A release is blocked until all are evidenced:

- [ ] Production schema and RPC inventory reconciled with the candidate migrations.
- [ ] Disposable local database can be rebuilt from zero with the ordered migration chain.
- [ ] Authorization/RLS tests pass for all roles and direct API access.
- [ ] Payment/PayFast sandbox and outbox retry/idempotency tests pass.
- [ ] Lint, TypeScript, build, integration, and E2E checks pass on the same commit.
- [ ] Vercel preview and environment-variable separation are verified.
- [ ] Backup restoration, monitoring, alerting, and incident recovery are demonstrated.
- [ ] Mobile, accessibility, and performance gates are reviewed.
- [ ] POPIA/PAIA documents and account export/deletion controls are reviewed.
- [ ] Explicit production migration and release approval recorded.

## Decisions / non-actions

- PR #3 remains a draft and must not be merged until the gates above are satisfied.
- PR #2 remains separate; do not merge it as a shortcut for this work.
- No production SQL, production data changes, or production deployment were initiated as part of this review.
