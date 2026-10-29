-- Harden administrator checks and booking statuses.
-- Run after the core schema and platform_settings table exist.
-- This migration is transactional and deliberately fails if expected schema is absent.

begin;

do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.provider_profiles') is null
     or to_regclass('public.provider_payment_accounts') is null
     or to_regclass('public.bookings') is null
     or to_regclass('public.platform_settings') is null then
    raise exception 'Security migration prerequisites missing: core tables and platform_settings must exist';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'provider_profiles'
      and column_name = 'is_active'
  ) then
    raise exception 'Security migration prerequisite missing: provider_profiles.is_active';
  end if;
end;
$$;

do $$
declare invalid_statuses text;
begin
  select string_agg(distinct status, ', ' order by status)
    into invalid_statuses
  from public.bookings
  where status is null
     or status not in ('pending', 'confirmed', 'rejected', 'in_progress', 'completed', 'closed', 'cancelled');

  if invalid_statuses is not null then
    raise exception 'Cannot add booking status constraint; unsupported existing statuses: %', invalid_statuses;
  end if;
end;
$$;

alter table public.bookings
  drop constraint if exists bookings_status_check;
alter table public.bookings
  drop constraint if exists bookings_status_allowed_check;
alter table public.bookings
  add constraint bookings_status_allowed_check
  check (status in ('pending', 'confirmed', 'rejected', 'in_progress', 'completed', 'closed', 'cancelled'))
  not valid;
alter table public.bookings
  validate constraint bookings_status_allowed_check;

-- Drop policies before removing the legacy function: PostgreSQL records function
-- dependencies in policy expressions. Recreate every known dependent policy below.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "providers_public_read_approved" on public.provider_profiles;
drop policy if exists "providers_authenticated_read" on public.provider_profiles;
drop policy if exists "providers_insert_own" on public.provider_profiles;
drop policy if exists "providers_update_own" on public.provider_profiles;
drop policy if exists "provider_payment_accounts_select_own" on public.provider_payment_accounts;
drop policy if exists "provider_payment_accounts_insert_own" on public.provider_payment_accounts;
drop policy if exists "provider_payment_accounts_update_own" on public.provider_payment_accounts;
drop policy if exists "bookings_insert_customer" on public.bookings;
drop policy if exists "bookings_customer_read" on public.bookings;
drop policy if exists "bookings_provider_update" on public.bookings;
drop policy if exists "platform_settings_admin_select" on public.platform_settings;
drop policy if exists "platform_settings_admin_insert" on public.platform_settings;
drop policy if exists "platform_settings_admin_update" on public.platform_settings;

-- Current-user-only check: there is no UUID parameter to probe other users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Replace trigger bodies to use the current-user-only function.
create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role not in ('customer', 'provider') then
      raise exception 'Only a trusted administrator can assign this profile role'
        using errcode = '42501';
    end if;
  elsif new.role is distinct from old.role then
    raise exception 'Only a trusted administrator can change a profile role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_profile_role_changes() from public, anon, authenticated;

create or replace function public.guard_provider_approval_changes()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.approval_status := 'pending';
    new.is_active := false;
    new.approved_at := null;
  elsif new.approval_status is distinct from old.approval_status
     or new.is_active is distinct from old.is_active
     or new.approved_at is distinct from old.approved_at then
    raise exception 'Only a trusted administrator can change provider approval'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_provider_approval_changes() from public, anon, authenticated;

-- Public directory reads never need to invoke an administrator predicate.
create policy "providers_public_read_approved"
on public.provider_profiles
for select
to anon
using (approval_status = 'approved' and is_active = true);

create policy "providers_authenticated_read"
on public.provider_profiles
for select
to authenticated
using (
  (approval_status = 'approved' and is_active = true)
  or auth.uid() = user_id
  or public.is_admin()
);

create policy "profiles_select_own"
on public.profiles for select to authenticated
using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own"
on public.profiles for insert to authenticated
with check (auth.uid() = id or public.is_admin());

create policy "profiles_update_own"
on public.profiles for update to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "providers_insert_own"
on public.provider_profiles for insert to authenticated
with check (auth.uid() = user_id or public.is_admin());

create policy "providers_update_own"
on public.provider_profiles for update to authenticated
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

create policy "provider_payment_accounts_select_own"
on public.provider_payment_accounts for select to authenticated
using (auth.uid() = provider_id or public.is_admin());

create policy "provider_payment_accounts_insert_own"
on public.provider_payment_accounts for insert to authenticated
with check (auth.uid() = provider_id or public.is_admin());

create policy "provider_payment_accounts_update_own"
on public.provider_payment_accounts for update to authenticated
using (auth.uid() = provider_id or public.is_admin())
with check (auth.uid() = provider_id or public.is_admin());

create policy "bookings_insert_customer"
on public.bookings for insert to authenticated
with check (auth.uid() = customer_id or public.is_admin());

create policy "bookings_customer_read"
on public.bookings for select to authenticated
using (auth.uid() = customer_id or auth.uid() = provider_id or public.is_admin());

create policy "bookings_provider_update"
on public.bookings for update to authenticated
using (auth.uid() = provider_id or public.is_admin())
with check (auth.uid() = provider_id or public.is_admin());

create policy "platform_settings_admin_select"
on public.platform_settings for select to authenticated
using (public.is_admin());

create policy "platform_settings_admin_insert"
on public.platform_settings for insert to authenticated
with check (public.is_admin());

create policy "platform_settings_admin_update"
on public.platform_settings for update to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Remove the arbitrary-UUID overload only after all dependent policies are replaced.
revoke all on function public.is_admin(uuid) from public, anon, authenticated;
drop function if exists public.is_admin(uuid);

commit;
