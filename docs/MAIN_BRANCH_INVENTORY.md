# Main Branch Inventory — Automotive Booking MVP

Last reviewed: 2026-10-23

Purpose: use `main` as the reference inventory while continuing work on `fix/payment-outbox-claim-ownership`. Reuse existing implementation; do not rebuild features just because work is happening on another branch. This is an inventory, not a claim that every feature has passed production verification.

## Branch and deployment context

- Repository: `Jebhlado/auto-service-mvp`
- Default branch: `main`
- General development branch: `feature/admin-settings`
- Current PayFast/outbox work: `fix/payment-outbox-claim-ownership`
- PR #2 is open and draft, from `fix/payment-outbox-claim-ownership` into `feature/admin-settings`, not `main`.
- GitHub comparison at review time: `feature/admin-settings` was 94 commits ahead of `main`; `fix/payment-outbox-claim-ownership` was 100 commits ahead of `main`. Recheck before any branch operation because refs can move.
- Never assume a Vercel deployment's branch or Supabase project: verify its Git commit and environment configuration.

## Existing features to reuse (not rebuild)

### Application foundation
- Next.js 15 / React 19 / TypeScript application.
- Supabase SSR/server client integration in `lib/supabase/server.ts`.
- Vercel deployment configuration; `vercel.json` is present on the development branch.
- Shared layout, header/footer, CSS and reusable components.

### Authentication and roles
- Sign-up, login and sign-out in `app/auth/actions.ts`.
- Auth page and shared form in `app/auth/page.tsx` and `components/auth-form`.
- Session/profile helpers and role gate in `lib/auth.ts`.
- Existing customer/provider/admin role-based routes.
- Security remediation is required before production approval: signup currently reads `role` from submitted form data and upserts it to `profiles`; production grants/policies observed on 2026-10-23 allow broad profile writes. Do not treat current role controls as secure until patched and verified.

### Customer experience
- Customer dashboard, booking list and status/statistic display.
- Provider search and provider booking flow.
- Quote review/rejection and customer completion confirmation.
- Payment-required messaging/payment return refresh components.
- Customer reviews.
- Relevant development-branch files include `app/customer/actions.ts`, `app/customer/page.tsx`, `components/customer/CustomerBookingRealtime.tsx`, and `components/customer/PaymentReturnRefresh.tsx`.

### Provider experience
- Provider dashboard and booking request accept/reject workflow.
- Provider onboarding/profile completion.
- Quote creation and job completion.
- Provider reviews and earnings UI exist in development-branch comparison; verify branch/deployment before assuming availability.
- Relevant files include `app/provider/actions.ts`, `app/provider/page.tsx`, `app/complete-provider-profile/page.tsx`, `app/provider/reviews/page.tsx`, and `app/provider/earnings/page.tsx`.

### Admin experience
- Admin dashboard and booking/provider management.
- Provider approval and active/inactive management.
- Admin booking status transitions.
- Admin settings implementation exists on `feature/admin-settings` in `app/admin/settings/` and `lib/platform-settings.ts`; review/reuse rather than recreate.

### PayFast and payment foundation
- Checkout/config/signature code under `lib/payfast/`.
- PayFast ITN endpoint at `app/api/payfast/notify/route.ts`.
- Payment state transition RPC integration (`transition_payment`).
- Payment return UX and payment-required workflow.
- Platform/provider earnings split has been part of the intended design; verify calculations and database constraints before accepting payouts/earnings as correct.
- Existing development-branch files include `lib/payment-outbox.ts`, `app/api/cron/payment-outbox/route.ts`, and `vercel.json`.
- Existing SQL scripts include `Supabase/PaymentProcessingOutbox.sql`, `Supabase/PaymentOutboxClaimOwnership.sql`, `Supabase/ProviderEarnings.sql`, `Supabase/NotificationIdempotency.sql`, `Supabase/NotificationSecurity.sql`, and `Supabase/AdminSettings.sql`.
- These standalone SQL files are not yet a complete, ordered migration history. Do not blindly run them against production.

### Notifications and UX
- Existing email/in-app notification helpers in `lib/notifications.ts` and `lib/create-notification.ts`.
- Notification idempotency/security improvements exist on the development branch.
- Shared header/footer and dashboard components exist; do not recreate without first checking the branch.

## Known issues / verification gates

1. **Profile role escalation/privacy:** production `public.profiles` has RLS enabled but observed grants to `anon` and `authenticated` include broad INSERT/UPDATE and role-column privileges; policies allow own-row updates and include an unrestricted read policy. Signup accepts a submitted role. Treat as urgent; patch app and database together, test locally, then plan a controlled production migration.
2. **Payment outbox RPC parity:** verify production/local definitions for `claim_payment_processing_outbox`, `complete_payment_processing_outbox`, and `retry_payment_processing_outbox` match `lib/payment-outbox.ts`. The production function inventory previously showed only the claim function among these names.
3. **Payment state machine:** verify `transition_payment` argument names/signature and all transitions against current code and live schema.
4. **Booking status schema:** code uses states including `in_progress`, `completed`, `closed`, `cancelled`; compare against actual constraints and transitions before changing schema.
5. **Database baseline/migrations:** local Supabase is running; production PostgreSQL reported 17.6 and local config uses PostgreSQL 17. Need an accurate local schema baseline before migrations/tests. Do not link/push to production during this work.
6. **PayFast ITN:** test signature encoding/order, merchant ID, IP validation/proxy trust, amount matching, server-side PayFast validation, duplicate notifications, idempotency, and failure/retry handling in sandbox.
7. **Dependency security:** previously, `npm audit --omit=dev` found zero vulnerabilities. Full audit showed high findings in the development lint dependency chain; do not use `npm audit fix --force` because it proposed a Next.js 14 downgrade. Recheck after dependency changes.
8. **Verification evidence:** lint, TypeScript and build passed on an earlier development commit. Rerun them on the exact candidate commit before merging/deploying. A successful build alone is not payment/security verification.
9. **POPIA/PAIA and operational readiness:** verify data minimization/access controls, privacy notices, retention, export/deletion workflows, logging/monitoring, backup restoration, incident response and disaster recovery before production sign-off.

## Working rules to avoid repeated work

- Before changing a feature, inspect its current file on the working branch and compare with `main` or another known-good branch when useful.
- Search GitHub history/branches when local context is incomplete; do not ask the user to rediscover already documented facts.
- Make changes at the source and carry fixes forward through Git, not manual copy/paste between branches.
- Record each finding with: source/commit, fix, test evidence, deployment checked, remaining risks.
- Do not claim a fix is verified unless the relevant test/log/query proves it.
- Keep PayFast sandbox credentials and test data separate from live credentials and production data.
- Do not merge PR #2 or apply production SQL without explicit review of the migration, function signatures, environment and validation evidence.

## Next focus

Continue on the PayFast test branch. First establish local schema/migration baseline, resolve profile-role security without breaking registration, then test the existing outbox/payment flow. Reuse existing application features and only implement demonstrated gaps.
