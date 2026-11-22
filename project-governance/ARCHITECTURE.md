# AutoCare Connect — Architecture

Last consolidated: 2026-11-22  
Repository: `Jebhlado/auto-service-mvp`

## 1. Product purpose

AutoCare Connect is a South African automotive-service marketplace connecting customers with independent service providers. The initial launch is Gauteng, focused on Ekurhuleni, with three launch categories: General Mechanics, Auto Electricians and Panel Beaters.

The product is an existing MVP. Architecture work must audit and improve the current implementation, not assume a rewrite is needed.

## 2. Current technology baseline

Repository evidence and prior project review identify:

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase Auth and PostgreSQL
- Supabase Storage
- Vercel hosting/deployment
- PayFast as initial payment gateway
- Optional Resend email delivery
- Tailwind CSS and existing shared components

Verify actual versions, deployment settings, environment variables and branch-specific code before implementation. Never assume a deployment is using the current branch or Supabase project.

## 3. Architecture principles

1. Server-authoritative security: client-side UI is never an authorization boundary.
2. Supabase RLS and server-side permission checks must agree.
3. Minimise data returned to browsers; use explicit column lists and purpose-built public views.
4. Privileged service-role access stays server-side and is used only after authentication, authorization and validation.
5. Booking/payment state transitions are explicit, validated and idempotent.
6. Preserve audit evidence for important actions, disputes, payments and sensitive admin access.
7. Use ordered, reproducible database migrations after reconciling live schema.
8. Keep payment gateway integration replaceable; PayFast is the initial provider.
9. Design provider categories and geographic coverage as data/admin-managed configuration.
10. Reuse existing application features; implement only evidenced gaps.
11. Mobile-first, accessible, observable and testable by default.
12. No production database/configuration changes without explicit approval and a verified rollback/recovery plan.

## 4. Main application domains

### Public/customer
- Public marketing/welcome pages and how-it-works information.
- Provider discovery and approved public provider profiles.
- Customer registration, authentication and profile.
- Booking application and attachments.
- Booking-scoped customer/provider chat.
- Quote approval, PayFast checkout, payment status/receipt.
- Vehicle inspection evidence, job status and completion confirmation.
- Reviews, support tickets, disputes, account export and deletion.

### Provider
- Registration and onboarding.
- Private verification documents and assessment evidence.
- Admin approval and mandatory training/agreement acceptance.
- Public profile and selected service areas.
- Availability, schedules and capacity.
- Booking accept/reject, quote and communication.
- Pre-work inspection, job progress and completion.
- Reviews/replies, earnings visibility and marketing resources.

### Admin
- One Administrator role in MVP.
- Provider verification/approval, workshop assessment and suspension/appeal.
- Customer/provider/booking/payment administration.
- Disputes, reviews, support tickets and reports.
- Platform settings, commission, notifications, promotions and maintenance mode.
- Sensitive record access and actions must be audit logged.
- A second restricted support account is planned; no shared credentials. Future roles may be introduced later.

## 5. Booking and payment lifecycle

Approved high-level workflow:

1. Customer submits booking application and required details/photos after explicit acceptance of Customer Protection and Workmanship Warranty Policy.
2. Provider reviews, requests clarification through booking chat if needed, then accepts or rejects within 24 hours.
3. Accepted provider prepares quote including service price, applicable callout fee, estimated completion and warranty.
4. Customer approves/rejects quote.
5. Payment is requested after quote approval through PayFast.
6. Verified payment permits job to move into In Progress and vehicle pre-work inspection.
7. Provider records vehicle condition; customer acknowledges or disputes before repair.
8. Provider performs work and records completion.
9. Customer confirms completion; verified completed booking may be reviewed.
10. Cancellation, rescheduling, disputes, payment events and notifications preserve a traceable history.

Server-side state machine and database constraints must enforce valid transitions. Never trust client-supplied status, amount, role, ownership or provider approval.

## 6. Payments and commission

- Initial gateway: PayFast.
- Platform commission: 15% of completed, paid bookings.
- Provider share: 85%.
- Cash deferred at initial launch.
- Verify whether PayFast split settlement is supported by the actual merchant configuration; otherwise design safe ledger/settlement operations without implying automatic split payout.
- PayFast ITN validation includes signature, merchant identity, amount, server-side validation, idempotency and replay/duplicate handling.
- Payment transition RPC and outbox function signatures must match the live database exactly.
- Failed/retried outbox work needs bounded retry/dead-letter/manual-review handling and monitoring.
- Refund, chargeback, reversal and reconciliation behaviour must be specified before launch.

## 7. Data protection and access boundaries

Classify information as public, internal, confidential or highly sensitive.

- Public: approved provider public profile fields, public content, published reviews subject to moderation.
- Internal: operational configuration and non-sensitive operational metrics.
- Confidential: booking details, chat, customer/provider contact details, support tickets and non-public business data.
- Highly sensitive: SA ID, proof of address, financial records, authentication secrets, private verification evidence and sensitive attachments.

Controls:
- RLS on all tables exposed through Supabase APIs.
- Server-side role/ownership checks for every privileged action.
- Explicit select lists and public-safe views; do not expose private profile fields through broad row reads.
- Private Storage buckets and short-lived signed URLs or server-authorised retrieval.
- Audit sensitive admin access (including view/download) and important changes.
- Do not log credentials, tokens, card data or unnecessary personal data.
- Account export/deletion must verify identity and honour legal retention/holds.
- Data minimisation, retention and lawful basis require POPIA/legal review.

## 8. File and archive strategy

- Restrict uploads by type, size and content signature.
- Quarantine/scan files before making them available.
- Use private storage for booking chat and verification documents.
- PDF chat attachments are approved; video remains deferred pending cost/usage research.
- Proposed 90-day post-completion/cancellation archive trigger from active Supabase Storage to private object storage, with Cloudflare R2 as candidate.
- 90 days is an archive trigger, not a deletion deadline.
- Self-service retrieval only for the customer's/provider's own records; sensitive documents require authorised handling.
- Use expiring links, audit logs, legal holds and category-specific retention/deletion.
- Confirm R2 pricing, region, processor terms and cross-border POPIA implications before committing.

## 9. Backup, recovery and continuity

Approved design direction:
1. Supabase operational database backup.
2. Independent off-site database and file backups.
3. Longer-retention vault for critical payment, booking, audit and legal evidence.

Proposed daily independent backups and quarterly restore tests; protect critical records more frequently/event-driven. Validate costs and recovery objectives. Supabase PITR is not assumed at launch without a cost/benefit decision.

Recovery priority:
1. Payments and financial records.
2. Bookings and customer/provider records.
3. Authentication.
4. Audit/dispute evidence.
5. Photos, PDFs and chat attachments.

A business continuity/disaster recovery plan must address owner unavailability, emergency admin access, outages, database failure, PayFast failure, security incidents, customer communication and restoration.

## 10. Notifications and operations

- Email and in-app notifications at launch.
- SMS and push deferred.
- Booking reminders at 24h and 2h; idempotent and invalidated on cancellation/reschedule/expiry.
- Incident monitoring covers app/API, Supabase, PayFast, storage, booking failures, payment/outbox, security, backups and cost.
- Severity: Critical, High, Medium, Low.
- Email all incidents; WhatsApp critical/high; admin dashboard all; SMS later fallback.
- Support Centre response targets are targets, not resolution guarantees: critical payment/security 1h; high 4 business hours; normal 1 business day; low 2 business days.

## 11. Security architecture baseline

Implement and verify the 25 approved controls in `DECISIONS.md`, including authentication, sessions, RLS, server authorization, input validation, rate limits, secrets, encryption/key management, upload scanning, payment fraud controls, audit logs, incident response, WAF/DDoS, security headers, CSRF/origin checks, restricted network/database access, CI security checks, supplier assessments, independent penetration testing and responsible disclosure.

Security testing must deliberately attempt to bypass controls in an authorised staging/test environment. Production destructive testing is prohibited without explicit, separately approved safeguards.

## 12. South African compliance architecture

Design for POPIA, CPA, ECTA, Companies Act, tax-record obligations and PAIA where applicable. Do not treat the platform as automatically responsible for all provider repair work, nor assume the marketplace model removes statutory duties.

- Record privacy notices, purposes, recipients/processors, safeguards, retention and data-subject rights.
- Determine lawful basis per processing purpose; do not assume consent is always the correct basis.
- Confirm Information Officer/Deputy Information Officer and PAIA requirements with qualified advice.
- Review consumer protection, service quality, workmanship warranty, refunds, disputes, insurance and provider agreements.
- Review cross-border processing and processor agreements for Supabase, Vercel, email, PayFast and storage.
- Retention is category-specific. POPIA requires no longer than necessary subject to lawful exceptions; company/tax/dispute obligations may require specific records to be retained. Do not retain every personal record for seven years by default.
- Legal holds preserve relevant evidence when required.

## 13. Performance, mobile and accessibility

- Mobile-first test widths: 320, 375, 390, 768, 1024 and 1440 px.
- Avoid horizontal overflow; touch targets and form controls must be usable.
- Keyboard navigation, visible focus, labels, semantics, screen-reader support and contrast.
- Profile database query plans; paginate growing lists; add indexes based on evidence.
- Optimise images and uploads; lazy-load heavy media; avoid unnecessary client bundles/rerenders.
- Measure Core Web Vitals and Lighthouse on public, customer, provider and admin routes.
- Do not claim compliance until measured.

## 14. Deployment and change management

- Production branch `main` is protected.
- `integration` is the final QA branch.
- One temporary working branch is used at a time.
- Current recorded working branch at consolidation: `work/security-hardening`; re-check live Git state before operations.
- Do not create branches, merge, push, reset, rebase, stash, drop stashes, apply SQL or change production config without explicit approval.
- Preserve existing local uncommitted changes and stashed SQL/build state.
- Never run production migrations until live schema, grants, RLS, functions, triggers and migration chain are reconciled and owner explicitly approves.
- Before each development session, read all five governance files.
