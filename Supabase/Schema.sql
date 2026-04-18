create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'provider', 'admin')),
  full_name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null,
  services text[] not null default '{}',
  location text not null default '',
  contact_email text not null,
  contact_phone text not null,
  bio text,
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(user_id) on delete cascade,
  appointment_date date not null,
  issue_description text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists provider_profiles_set_updated_at on public.provider_profiles;
create trigger provider_profiles_set_updated_at
before update on public.provider_profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.bookings enable row level security;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "providers_public_read_approved" on public.provider_profiles;
create policy "providers_public_read_approved"
on public.provider_profiles
for select
to authenticated, anon
using (approval_status = 'approved' or auth.uid() = user_id or public.is_admin());

drop policy if exists "providers_insert_own" on public.provider_profiles;
create policy "providers_insert_own"
on public.provider_profiles
for insert
to authenticated
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "providers_update_own" on public.provider_profiles;
create policy "providers_update_own"
on public.provider_profiles
for update
to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "bookings_insert_customer" on public.bookings;
create policy "bookings_insert_customer"
on public.bookings
for insert
to authenticated
with check (auth.uid() = customer_id or public.is_admin());

drop policy if exists "bookings_customer_read" on public.bookings;
create policy "bookings_customer_read"
on public.bookings
for select
to authenticated
using (auth.uid() = customer_id or auth.uid() = provider_id or public.is_admin());

drop policy if exists "bookings_provider_update" on public.bookings;
create policy "bookings_provider_update"
on public.bookings
for update
to authenticated
using (auth.uid() = provider_id or public.is_admin())
with check (auth.uid() = provider_id or public.is_admin());
