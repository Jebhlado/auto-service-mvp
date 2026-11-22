# AutoCare Connect — Feature and Readiness Tracker

Last consolidated: 2026-11-22

## Status definitions

- **Existing — verify:** feature is reported in the repository/product; implementation and branch/deployment must be checked.
- **Approved — not verified:** owner approved requirement; no implementation proof recorded here.
- **In progress:** work is actively underway.
- **Outstanding:** not yet evidenced as complete.
- **Blocked:** do not proceed until prerequisite/evidence/approval exists.

This is a governance tracker, not a claim that the application is production-ready.

## 1. Existing product capabilities to preserve and audit

| Area | Known existing capability | Status / next verification |
|---|---|---|
| App foundation | Next.js App Router, React, TypeScript, Supabase, Vercel | Existing — verify deployed commit/config |
| Authentication | Customer/provider sign-up/login, sign-out and role-based routes | Existing — security audit in progress |
| Provider management | Provider onboarding/profile and admin approval | Existing — verify role/approval enforcement |
| Provider discovery | Search and public provider profile pages | Existing — privacy/security audit in progress |
| Booking | Customer booking and provider accept/reject workflow | Existing — verify complete state machine |
| Quotes | Provider quote and customer quote response | Existing — verify amount/ownership/state rules |
| PayFast | Checkout/ITN/payment return integration | Existing — end-to-end sandbox verification outstanding |
| Payment outbox | Outbox processing and scheduled Vercel endpoint | Existing — RPC parity, retries, monitoring outstanding |
| Notifications | Email/in-app notification helpers | Existing — delivery/idempotency/retry verification |
| Customer reviews | Review flow exists | Existing — moderation/eligibility/security verification |
| Admin settings | Admin settings implementation exists on a development branch | Existing — verify branch/deployment before reuse |
| Customer introduction | Customer introduction page exists | Existing — preserve; add dashboard How it works access |
| Shared UI | Shared layout/header/footer components exist in some branches | Existing — inspect exact branch; footer content incomplete |

## 2. Owner-approved features and requirements

| Feature | Status | Notes |
|---|---|---|
| Gauteng/Ekurhuleni initial coverage | Approved — not verified | Only genuine provider coverage should appear |
| Three initial categories | Approved — not verified | General Mechanics, Auto Electricians, Panel Beaters |
| Database-driven categories/locations | Approved — not verified | Plan for all nine provinces, later Africa |
| Provider verification and workshop assessment | Approved — not verified | Develop standard; independent automotive professional validation |
| Mandatory provider agreement and training | Approved — not verified | Eight modules and recorded acceptance/completion |
| Provider schedules/capacity/no double-booking | Approved — not verified | Africa/Johannesburg, server-enforced |
| 24-hour provider response/auto-expiry | Approved — not verified | Server-side enforcement |
| Quotes and post-approval payment | Existing/approved — verify | Include fees, estimate and warranty |
| Customer policy acceptance | Approved — not verified | Explicit, unticked, versioned and timestamped |
| Vehicle pre-work inspection | Approved — not verified | Separate booking images from inspection evidence |
| Rescheduling and cancellation history | Approved — not verified | Mutual acceptance for reschedule |
| 24h/2h reminders | Approved — not verified | Email + in-app, idempotent, no stale reminders |
| Booking chat and PDF attachments | Approved — not verified | Preserve full booking conversation |
| Customer/provider reviews | Existing/approved — verify | Completed verified bookings only |
| Support Centre | Approved — not verified | Tickets, statuses, assignment, evidence, notifications |
| Maintenance mode | Approved — not verified | Existing bookings and PayFast processing remain safe |
| Account deletion and data export | Approved — not verified | Legal retention and identity checks |
| Provider shareable profiles/marketing kit | Approved — not verified | QR, WhatsApp/social assets, analytics |
| FAQ/automotive education centre | Approved — not verified | Editorial approval and SEO |
| Promotions/referrals | Approved — not verified | No reward at initial launch; discount funding explicit |
| Storage archive and R2 | Approved direction — verify | 90-day archive trigger, not deletion; cost/POPIA review |
| Three-layer backup | Approved — not verified | Restore drills required |
| Monitoring and incident management | Approved — not verified | Health, payments, bookings, security, backup, cost |
| Business continuity/disaster recovery | Approved — not verified | Owner absence, outages, payment/database/security failure |
| AutoCare Compliance AI Agent | Future approved direction | Research/remind/prepare; no filing/payment/legal decisions without approval |

## 3. Security work

Owner approved all 25 security requirements across five batches. Security assessment and third-party assessment are already underway according to the owner. The active approach includes deliberate attempts to break/bypass the application in a controlled test environment.

| Workstream | Status | Evidence required |
|---|---|---|
| Authentication/session/password controls | In progress / verify | Auth settings, recovery tests, session revocation tests |
| RLS and data separation | In progress | Policies, grants, direct API tests across roles |
| Server-side authorization | In progress | Route/action inventory and negative tests |
| Sensitive data encryption/key lifecycle | Approved — not verified | Key storage/rotation/recovery design and tests |
| API validation/rate limits | Approved — not verified | Endpoint inventory and abuse tests |
| Upload validation/malware scanning | Approved — not verified | File signature/size/type/quarantine/scan tests |
| Payment fraud/idempotency | In progress | Duplicate, mismatch, replay and concurrent-worker tests |
| Admin audit logging | Approved — not verified | Read/download/action audit evidence |
| WAF/DDoS and browser headers | Approved — implementation verification outstanding | Vercel/Cloudflare configuration and header tests |
| CSRF/origin/CORS | Awaiting questionnaire answer / verification | Negative cross-origin and CSRF tests |
| Database/network restrictions | Awaiting questionnaire answer / verification | Privilege and network configuration review |
| CI/CD security checks | Awaiting questionnaire answer / verification | Pipeline evidence; critical findings block deployment |
| Incident response | Awaiting questionnaire answer / verification | Documented exercise/tabletop evidence |
| Independent penetration test | Awaiting questionnaire answer / verification | Findings, severity, remediation and retest report |
| Supplier assessments | In progress | PayFast, Supabase, Vercel, email, storage, WhatsApp |
| Responsible disclosure | Awaiting questionnaire answer / verification | Public security contact and policy |

## 4. Launch readiness gates

All gates require evidence against the exact candidate release commit and production configuration.

### Technical gate
- [ ] Production schema, grants, RLS, triggers, indexes and RPCs reconciled.
- [ ] Ordered migrations rebuild an empty disposable database.
- [ ] Live schema differences documented and reconciled safely.
- [ ] All customer/provider/admin/anonymous direct API authorization tests pass.
- [ ] Booking lifecycle and concurrency tests pass.
- [ ] PayFast sandbox tests pass: signature, merchant, amount, server validation, duplicates, out-of-order notifications, retries and reconciliation.
- [ ] Payment outbox retry/dead-letter/monitoring verified.
- [ ] `npm ci`, lint, `npx tsc --noEmit`, build and test suites pass on same commit.
- [ ] Playwright end-to-end flows pass.
- [ ] Vercel preview/production environment separation verified.
- [ ] Error monitoring, structured logs, alerts and correlation IDs operational.
- [ ] Backup restoration to non-production demonstrated.
- [ ] Security assessment critical/high findings remediated and retested.
- [ ] Mobile widths, accessibility and Lighthouse/performance gates reviewed.
- [ ] File storage, archive, retrieval and retention controls tested.

### Business/legal gate
- [ ] Company registered and ownership/IP arrangements documented.
- [ ] PayFast merchant and business bank arrangements completed.
- [ ] Accountant review completed.
- [ ] South African legal review completed.
- [ ] Privacy/Terms/Cookie/PAIA and other required documents approved.
- [ ] Provider Agreement and customer protection/warranty policy approved.
- [ ] Refund/cancellation/dispute policy approved.
- [ ] Provider verification/training standard validated.
- [ ] Insurance requirements and supplier/processor terms reviewed.
- [ ] Support Centre, escalation and incident response staffed/tested.
- [ ] Data export/deletion and retention/legal-hold processes tested.
- [ ] Business continuity/disaster recovery and emergency admin access tested.

### Go-live gate
- [ ] Technical gate passed.
- [ ] Business/legal gate passed.
- [ ] Owner explicitly approves go-live.
- [ ] Monitoring, support, rollback and customer communication ready.

Critical security, payment, privacy or data-integrity defects block launch.

## 5. Marketing — priority 2

Marketing execution begins immediately after application launch readiness. Build Gauteng/Ekurhuleni launch plan with channel strategy, budget, content calendar, provider recruitment, customer acquisition, community/workshop partnerships, WhatsApp Business, social, Google Business Profile/local SEO, referrals and promotions. Track CAC, provider acquisition, completed bookings and commission.

## 6. Production readiness tracker

| Requirement | Status |
|---|---|
| Mobile testing completed | Outstanding evidence |
| Lighthouse/performance review | Outstanding evidence |
| Security review | In progress |
| Independent penetration test and retest | Approved; active testing underway |
| Error monitoring/logging | Outstanding evidence |
| Backups verified by restore drill | Outstanding evidence |
| Account deletion | Approved; implementation/test evidence outstanding |
| Data export | Approved; implementation/test evidence outstanding |
| MFA for admin/provider | Approved direction; configuration/evidence outstanding |
| Disaster recovery plan and test | Approved; evidence outstanding |
| POPIA/PAIA legal review | Outstanding |
| Customer support operations | Approved; implementation/evidence outstanding |
| Owner go-live sign-off | Outstanding |

