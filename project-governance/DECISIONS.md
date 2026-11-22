# AutoCare Connect — Decision Register

Last consolidated: 2026-11-22  
Repository: `Jebhlado/auto-service-mvp`  
Documentation branch: `work/security-hardening`

This register captures owner decisions recorded in project conversations. It does not claim that features are implemented, tested, legally approved, or deployed.

## Status meanings

- **Approved** — the owner explicitly accepted the direction.
- **Recommendation** — an engineering or operational recommendation, not an owner decision unless separately approved.
- **Technical verification** — inspect the existing code, live configuration or evidence before implementation.
- **Legal/accounting review** — obtain qualified South African professional review before relying on the position.
- **Outstanding** — no final decision or evidence recorded.

## 1. Business model and commercial decisions

| ID | Decision | Status |
|---|---|---|
| BIZ-001 | Marketplace model: independent automotive service providers contract with customers; AutoCare Connect facilitates discovery, bookings, verification, payment coordination, support and disputes. | Approved |
| BIZ-002 | Initial platform commission is 15% of completed, paid bookings; provider share is 85%. | Approved |
| BIZ-003 | PayFast is the initial payment gateway. Keep payment integration abstract enough to add gateways later. | Approved |
| BIZ-004 | PayFast split settlement may be used only if the merchant/product setup supports it and it is verified. Do not assume availability. | Technical verification |
| BIZ-005 | Providers register without an initial registration fee or monthly subscription; platform revenue initially comes from commission. | Approved |
| BIZ-006 | Cash payments are deferred for the initial launch. | Approved |
| BIZ-007 | Providers pay for their own appropriate insurance. Requirements are risk-based; workshops holding vehicles require appropriate cover. Consider platform liability and cyber cover. | Approved |
| BIZ-008 | Promotions and discounts are supported, but the funding source must be explicit. A discount must not reduce the provider's 85% share without agreement. | Approved |
| BIZ-009 | Referral tracking is approved; no financial reward at initial launch. Future credits/discounts require approval and fraud controls. | Approved |
| BIZ-010 | Refund, dispute, chargeback and recovery policy requires a detailed evidence-led process and must not promise platform-funded compensation without an approved policy and legal review. | Outstanding / Legal review |
| BIZ-011 | Independent accountant review before launch, covering commission, settlements, VAT/tax, invoices, records, refunds/chargebacks and financial reporting. | Approved |
| BIZ-012 | Company registration is planned after app completion but before public commercial launch. Preferred entity name: AutoCare Connect (Pty) Ltd. | Approved direction |
| BIZ-013 | Owner intends to be the sole shareholder (100%) and sole director initially, subject to registration and professional advice. | Approved direction / Legal review |
| BIZ-014 | Company should own source code, brand, domain, database design, documentation and project IP after appropriate assignment/transfer. Verify existing ownership and third-party licences. | Approved / Legal review |
| BIZ-015 | South African trademark search/registration is first priority; international protection later. Company name, trademark and domain availability are not yet confirmed. | Approved direction / Verification |
| BIZ-016 | Preferred domains are `autocareconnect.co.za` and `autocareconnect.com`; availability and registration remain unverified. | Outstanding |
| BIZ-017 | PayFast merchant onboarding and business banking follow company registration; sandbox work can continue meanwhile. | Approved |
| BIZ-018 | Obtain South African legal review before launch for marketplace model, consumer law, contracts, insurance, warranty, tax and related obligations. | Approved |

## 2. Launch geography, provider categories and discovery

| ID | Decision | Status |
|---|---|---|
| GEO-001 | Initial launch is Gauteng, with Ekurhuleni focus. Search should show only genuine service coverage. | Approved |
| GEO-002 | Initial service categories are General Mechanics, Auto Electricians and Panel Beaters. | Approved |
| GEO-003 | Plan for all nine South African provinces and later other African countries, but do not enable expansion until operationally ready. | Approved |
| GEO-004 | Future categories may include tyres/alignment, windscreens, diagnostics, air-conditioning, towing/roadside assistance and detailing. | Approved |
| GEO-005 | Categories and locations should be database/admin managed, not hardcoded. Category-specific qualifications, verification, insurance and booking forms are required. Deactivation must preserve history. | Approved |
| GEO-006 | Expansion requires demonstrated demand, qualified providers, insurance/legal readiness, operational capacity and commercial viability. | Approved |
| GEO-007 | Providers select service areas during onboarding and can update them later; public profiles show only selected service areas. | Approved |
| GEO-008 | Search filters: service type, location/distance, rating, availability date/time, and mobile/workshop service. Price range is excluded because pricing is case-by-case. | Approved |
| GEO-009 | Provider availability states: Available, Temporarily unavailable and Inactive. Unavailable providers are excluded from ordinary search; confirmed bookings remain visible and must be honoured or rescheduled. | Approved |
| GEO-010 | Provider can edit ordinary profile/business information; sensitive identity, business, qualification and verification information changes require admin review. Public photos are moderated. | Approved |
| GEO-011 | Public profile shows business description/services, up to three completed-job photos, up to three workshop photos, reviews, verification status, hours/availability, service areas and service mode. Private identity/address/contact data stays private. | Approved |
| GEO-012 | Provider schedules include working days/hours, unavailable dates and capacity; mobile/workshop schedules may differ. Use Africa/Johannesburg and enforce no double-booking server-side. | Approved |
| GEO-013 | Search ranking considers relevance, availability, location, rating and reliability; new providers receive a fair opportunity and there is no paid ranking. | Approved |
| GEO-014 | Customer rating and provider reliability score are separate. Unverified complaints do not automatically reduce score; providers can challenge complaints; new providers are not penalised for having no reviews. | Approved |
| GEO-015 | Provider suspension/removal is proportionate, evidence-based and includes reasons, response opportunity, appeal and reinstatement process. Immediate temporary restrictions may be used for credible safety risks. | Approved |
| GEO-016 | MVP has one Administrator role. Future roles may include Super Admin, Admin and restricted support staff. | Approved |
| GEO-017 | Providers may share public profile links through WhatsApp/Facebook/Instagram; track visits and conversions where privacy-compliant. | Approved |
| GEO-018 | Provider marketing kit includes branded posters, social templates, QR codes, WhatsApp materials and brand-use guidance, downloadable from provider dashboard. | Approved |

## 3. Provider verification, training and standards

| ID | Decision | Status |
|---|---|---|
| PRO-001 | Provider verification includes South African ID, proof of address, applicable business registration documents, relevant trade qualifications/certificates, and six photos (three completed jobs; three workshop photos where workshop-based). | Approved |
| PRO-002 | Identity and proof-of-address documents are private. Portfolio/workshop photos may be public only after moderation and appropriate consent. | Approved |
| PRO-003 | Workshop providers require an in-person assessment before approval, including premises, safety, tools/equipment, waste management, capability, zoning/municipal compliance, staff and insurance. | Approved |
| PRO-004 | Mobile-only providers receive document, qualification, tools, practical competency, reference and reputation checks; no workshop inspection where there is no customer-facing workshop. | Approved |
| PRO-005 | References/reputation checks require consent and may include previous customers, employers or workshops; they are not a guarantee. | Approved |
| PRO-006 | Create a Provider Verification and Workshop Assessment Standard with practical test, scoring, evidence, pass/fail, remediation and reassessment. An independent qualified automotive professional must validate it. | Approved |
| PRO-007 | Do not claim internal marketplace levels are official QCTO, NQF or MIWA accreditation. | Approved |
| PRO-008 | Provider Growth & Opportunities content may include authorised study guides, qualification/trade-test guidance, QCTO/merSETA routes, training, apprenticeships/learnerships and business development. Initially provide information and links; partnerships may follow. Do not distribute copyrighted exam papers without permission. | Approved |
| PRO-009 | Provider training is mandatory before activation: eight modules covering platform, dashboard, bookings, quotes/payments, communication, inspection, workmanship/disputes, and security/compliance. Include assessment, manual, videos/handbook, checklist and training record. | Approved |
| PRO-010 | Provider activation requires completed verification, accepted Provider Agreement and completed mandatory training. | Approved |

## 4. Booking, quotes, payments, vehicle inspection and warranty

| ID | Decision | Status |
|---|---|---|
| BOOK-001 | Providers manually accept/reject every booking request. | Approved |
| BOOK-002 | Provider response deadline is 24 hours; requests auto-expire and both parties are notified. Enforce server-side using Africa/Johannesburg. | Approved |
| BOOK-003 | Existing quote feature is to be reused. Quotes include service price, callout fee where applicable, estimated completion and warranty information. | Approved |
| BOOK-004 | Customer must approve/reject quote before payment. Payment is requested after quote approval. | Approved |
| BOOK-005 | Customers and providers may cancel; provider must supply a reason. Repeated cancellations are tracked. Paid-booking refund rules require final policy/legal review. | Approved / Outstanding policy |
| BOOK-006 | Either party may request rescheduling; the other must accept. Original time remains confirmed until mutual acceptance. Recheck availability and preserve original/proposed times, responses and history. | Approved |
| BOOK-007 | Send email and in-app reminders to both parties 24 hours and 2 hours before appointment. Prevent stale reminders after cancellation, expiry or reschedule; use idempotency and delivery logs. | Approved |
| BOOK-008 | Customer vehicle inspection after verified payment moves job to In Progress. Provider records pre-work condition before repair; customer acknowledges or disputes before work. Keep original booking photos separate from pre-work inspection evidence. | Approved |
| BOOK-009 | Before job completion, provider should request required inspection/acknowledgement or record a reasoned exception. Missing inspection is an evidence factor, not automatic proof of fault. | Approved |
| BOOK-010 | Customer must explicitly accept the Customer Protection and Workmanship Warranty Policy before submitting a booking application. Checkbox must not be preselected. Store customer, time, policy version and acceptance evidence; require reacceptance after material changes. No waiver of statutory rights. | Approved |
| BOOK-011 | Customer protection, warranty, refund and dispute wording requires South African legal review, including CPA implications. | Approved / Legal review |
| BOOK-012 | Vehicle damage complaint workflow is approved: report, notify provider, response, evidence/photos/inspection, investigation, recorded outcome and escalation where needed. Liability follows contract, insurance and law; no automatic platform-funded compensation promise. | Approved |
| BOOK-013 | Provider Agreement required before activation; cover independent status, 15% commission, quality, verification, insurance, POPIA, booking/cancellation, quote/payment, warranty, disputes, suspension/termination/appeal and South African law. Record e-sign/version/time/account evidence and reaccept material changes. | Approved / Legal review |
| BOOK-014 | Booking chat is booking-scoped, retained after completion/cancellation, accessible to booking participants and authorised admin support. Record sender/time; no silent edit/delete; enforce RLS/private storage and notify participants. | Approved |
| BOOK-015 | Booking chat supports PDF documents. Video is deferred pending cost/usage research. Existing text/image support should be audited and reused. | Approved |
| BOOK-016 | Chat attachments use file size/type restrictions, private storage, malware scanning and authorised access. | Approved |
| BOOK-017 | Customer reviews are limited to completed verified bookings; 1–5 stars, written review, provider public reply, customer reporting and reasoned admin moderation. Reviews cannot be removed merely because provider dislikes them; guard against retaliation. | Approved |

## 5. Customer, provider and admin experience

| ID | Decision | Status |
|---|---|---|
| UX-001 | Customer dashboard includes upcoming/previous bookings, status, quotes, payments/receipts, reschedule/cancel, disputes, reviews, personal details, account deletion and data export. | Approved |
| UX-002 | Audit existing provider dashboard before adding/rebuilding functionality; many required features may already exist. | Approved |
| UX-003 | Admin dashboard should cover customer/provider statistics, pending verification, bookings, payments/commission, performance, disputes, reviews/reports, suspensions/removals and activity/operations. | Approved |
| UX-004 | Admin settings should support commission, 24-hour response rule, notifications, maintenance mode and provider approval; audit existing implementation before rebuilding. | Approved |
| UX-005 | Customer introduction page already exists and should be retained. Add permanent How it works access in customer dashboard/navigation, contextual guidance and support link. | Approved |
| UX-006 | Legacy Mechanic Connect Test branding should be addressed in a dedicated branding review. | Approved |
| UX-007 | Public FAQ/automotive education centre is approved as a customer resource and SEO/content asset. Admin controls publication; AI-assisted drafts require technical/editorial review and approval, with author/review dates and corrections. | Approved |
| UX-008 | Website footer is outstanding; include About, How it works, find provider, provider registration, Help/FAQs, contact/support, privacy, terms, PAIA and social links. | Approved |
| UX-009 | Email and in-app notifications are launch channels. SMS and push notifications are deferred. | Approved |
| UX-010 | Customer and provider account deletion is required, subject to lawful retention; delete or anonymise data where lawful. | Approved |
| UX-011 | Customer/provider data export is required with identity verification, expiring secure link, own-record scope, third-party data protection and audit trail. | Approved |
| UX-012 | Support Centre tickets are linked to bookings where relevant, with categories, evidence, status (Open/In Progress/Awaiting Customer/Escalated/Resolved), assignment, history and email notifications. Restrict to authorised staff. | Approved |
| UX-013 | Support response targets: critical payment/security 1 hour; high booking disruption/serious complaint 4 business hours; normal 1 business day; low 2 business days. These are response targets, not guaranteed resolution times; measure using business-hours calendars. | Approved |
| UX-014 | Maintenance mode should prevent new booking requests/provider acceptance, show notice/ETA, retain admin access and existing booking access, and allow PayFast confirmations/outbox processing to continue safely. Support scheduled and emergency modes with audit trail. | Approved |
| UX-015 | One primary admin initially, with ability to invite one additional restricted support person. No shared credentials; separate account, MFA and audit. Future roles can expand. | Approved |
| UX-016 | Emergency administrator recovery is required if owner loses email, phone and authenticator: verify identity/business ownership, revoke sessions/codes, re-enrol MFA; no backdoor or master password. | Approved |
| UX-017 | Second-person approval for sensitive admin actions is a future control, not MVP. At launch use explicit confirmation, permissions, audit and alerts. | Approved |
| UX-018 | Business continuity plan includes owner unavailability, emergency admin, outages, database failure, PayFast failure, security incidents and customer communication. | Approved |

## 6. Storage, backups, monitoring and operations

| ID | Decision | Status |
|---|---|---|
| OPS-001 | Archive eligible files from active Supabase storage after 90 days following booking completion/cancellation to private object storage, with Cloudflare R2 as the proposed option. The 90-day trigger is not a deletion deadline. | Approved direction / Technical and legal verification |
| OPS-002 | Customer/provider self-service retrieval for own records; sensitive documents require authorised admin handling. Use expiring links, audit logs, legal holds and retention-based deletion. | Approved |
| OPS-003 | Verify Cloudflare R2 pricing, region, processor terms and POPIA cross-border implications before committing. | Technical/legal verification |
| OPS-004 | Three backup layers: Supabase operational backup, independent off-site database and file backup, and a longer-retention critical-records vault. | Approved |
| OPS-005 | Proposed daily independent backups and quarterly restore tests; critical records should be protected more frequently/event-driven. Validate frequency, costs and restore evidence. | Approved direction / Technical verification |
| OPS-006 | Supabase PITR at additional cost is not assumed for launch; evaluate only if recovery objectives justify it. | Recommendation / Cost verification |
| OPS-007 | Recovery priority: payments/financial records; bookings/customer/provider records; authentication; audit/dispute evidence; photos/PDF/chat attachments. | Approved |
| OPS-008 | Monitoring and incident management should cover site/APIs/Supabase/PayFast/storage health, payments/outbox, booking failures, security, backups and cost, with admin dashboard and severity Critical/High/Medium/Low. | Approved |
| OPS-009 | Alert channels: email for all incidents, WhatsApp for critical/high, admin dashboard for all; SMS is a later fallback. | Approved |
| OPS-010 | Research WhatsApp alert vendor/setup costs before selecting a provider. | Outstanding |
| OPS-011 | Comprehensive audit logs for important user/admin/system actions, with actor/role/action/record/time/old-new values/reason/source/correlation/success-failure as appropriate. Separate business audit, security and application/system logs; restrict and protect from tampering. Never log passwords, tokens, card credentials or unnecessary personal data. | Approved |
| OPS-012 | Business continuity and disaster recovery are required; verify backups through actual restore drills. | Approved |

## 7. Security decisions — 25 approved

All 25 security questionnaire decisions were explicitly approved by the owner across five batches. Questions 16–20 were approved together (yes to all five); questions 21–25 were also approved. The requirements are:

| ID | Approved requirement |
|---|---|
| SEC-001 | Email verification for customers/providers before account use. |
| SEC-002 | Detect repeated failed logins; rate limits, progressive delays, suspicious-IP detection and security notifications. |
| SEC-003 | Admins and providers can view/revoke individual active sessions and log out everywhere. Customers get secure logout and session expiry without a dedicated device-management UI in the initial MVP. |
| SEC-004 | Strict customer/provider/admin data separation, Supabase RLS, server-side authorization and automated regression tests. Audit and strengthen current work rather than rebuild it. |
| SEC-005 | Additional encryption/access controls for sensitive IDs, proof of address, financial records and private attachments. |
| SEC-006 | Strong password handling and compromised-password checks. |
| SEC-007 | Use researched current best-practice password recovery settings. Recommended baseline: long passwords (15-character minimum for single-factor, maximum length at least 64), no arbitrary composition rules or forced periodic changes, breached-password screening, single-use reset tokens with maximum one-hour expiry, rate limiting, generic responses, change notifications, HTTPS and allowlisted redirects. Validate actual Supabase Auth settings and scanner-safe recovery flow. |
| SEC-008 | Every API endpoint requires authentication, authorization, input validation, rate limiting and abuse protection, especially booking, quotes, payments, uploads and admin routes. |
| SEC-009 | Centralise secrets management. Supabase service role, PayFast, encryption and API keys remain server-only, access-restricted and rotatable; never expose service-role keys to browsers. |
| SEC-010 | Continuous dependency/source scanning, including dependency alerts, static analysis and secret detection; prioritise remediation. |
| SEC-011 | Detect and report unusual access to customer records, provider documents, bookings and financial data. |
| SEC-012 | Validate and scan uploads (images/PDF/future video): signatures, size/type, quarantine and malware scanning. |
| SEC-013 | Protect financial workflows with fraud checks, duplicate-attempt prevention, amount matching and suspicious-pattern flags. Flags require investigation, not automatic conclusions. |
| SEC-014 | One Admin role for MVP with full operational access; sensitive access/actions must be logged, including record viewed/downloaded, actor, time and reason/action. |
| SEC-015 | Formal incident response: prepare, detect, contain, investigate/preserve evidence, recover, report where legally required, and improve. Include severity, owner, steps, contacts, evidence and post-incident review. POPIA notification is assessed under law; not every alert is reportable. |
| SEC-016 | WAF and DDoS protection. |
| SEC-017 | Browser security headers/protections including CSP, HSTS, frame restrictions and secure cookie settings. |
| SEC-018 | CSRF, origin and CORS protections; CORS alone is not a CSRF defence. |
| SEC-019 | Restrict database/network access and privileged access; minimise exposed endpoints. |
| SEC-020 | Automated security checks in CI/CD; critical findings block deployment. |
| SEC-021 | Encryption keys stored separately from application data, access-restricted, rotated as needed and recoverable through controlled backup. |
| SEC-022 | Classify data (public, internal, confidential, highly sensitive) and apply access/retention rules accordingly. |
| SEC-023 | Independent penetration testing before launch and retesting of critical/high-risk findings. Owner confirmed active security testing is already underway and that deliberate break/bypass testing is expected. |
| SEC-024 | Assess third-party supplier/integration security, privacy, reliability and processing risks. Owner confirmed this work is already underway. |
| SEC-025 | Publish security contact and responsible-disclosure process. |

### Security implementation caveat

Approval of these requirements is not proof of implementation. Each control must be mapped to existing code/configuration, tested and evidenced. Penetration testing must be authorised and controlled; use staging/test data for destructive testing and do not damage production records or real payments.

## 8. Marketing — priority after launch readiness

| ID | Decision | Status |
|---|---|---|
| MKT-001 | Marketing/customer acquisition is the second major priority immediately after application launch readiness. | Approved |
| MKT-002 | Initial marketing focus is Gauteng/Ekurhuleni. | Approved |
| MKT-003 | Channels include Facebook/Instagram, TikTok, WhatsApp Business, Google Business Profile/local SEO, workshops/community partnerships, provider recruitment, referrals and promotions. | Approved |
| MKT-004 | Marketing execution should include budget, calendar, creative assets, content, provider recruitment and customer acquisition. | Approved |
| MKT-005 | Measure customer acquisition cost, provider acquisition, completed bookings and platform commission. | Approved |
| MKT-006 | FAQ/automotive education centre is part of the content marketing and SEO strategy. | Approved |

## 9. Future Compliance AI Agent

| ID | Decision | Status |
|---|---|---|
| FUT-001 | Plan a future AutoCare Compliance AI Agent to monitor SARS/CIPC/Information Regulator deadlines and regulatory changes, maintain a compliance calendar, issue reminders and prepare reports for accountant/attorney review. | Approved future direction |
| FUT-002 | Agent may research, prepare and remind; it must not file taxes, make payments or make binding legal decisions without owner/accountant approval. Maintain an evidence trail. | Approved |

## 10. Required documentation

Maintain and prepare the following documents as applicable:

- Privacy Policy
- Terms and Conditions
- Cookie Policy
- Disclaimer
- PAIA Manual (confirm private-body applicability and exact obligations)
- Security Policy
- Data Retention Policy
- Incident Response Procedure
- Provider Agreement
- Customer Protection and Workmanship Warranty Policy
- Refund, Cancellation and Dispute Policy
- Provider Verification and Workshop Assessment Standard
- Provider Training Manual
- Business Continuity and Disaster Recovery Plan
- Security Vulnerability Disclosure Policy
- Supplier/Processor Register and assessment records

All legal documents require South African professional review before launch. Do not apply one retention period to all personal information. Retain only as long as lawfully necessary; company, tax, dispute and legal-hold requirements must be assessed by record category.
