# AutoCare Connect MVP

Lean web platform for connecting customers with automotive service providers for appointment bookings.

## Stack

- Next.js App Router
- Supabase Auth + Postgres
- Optional Resend email notifications

## Features

- Customer sign up and login
- Provider sign up and login
- Admin approval flow for providers
- Search providers by location and service type
- Provider profile pages
- 3-step appointment booking flow
- Provider accept or reject booking requests
- Admin dashboard for provider approvals and all bookings

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
Copy-Item .env.example .env.local
```

3. Add your Supabase project values to `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `APP_BASE_URL`

4. Optional email notifications:

- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`

5. In Supabase SQL Editor, run the schema in `supabase/schema.sql`.

6. Turn off email confirmation in Supabase Auth for the fastest MVP flow, or adapt the auth flow for confirmed-email onboarding.

7. Create your first admin user:

- Sign up normally through the app
- In Supabase SQL Editor run:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_ID';
```

8. Start the app:

```bash
npm run dev
```

## Booking flow

1. Customer searches for an approved provider
2. Customer selects a date and describes the issue
3. Provider accepts or rejects the pending booking

## Notes

- Providers stay hidden from search until admin approval
- Bookings start as `pending`
- Accepted bookings change to `confirmed`
- Rejected bookings change to `rejected`
- Email notifications gracefully fall back to console logs when Resend is not configured
