-- Critical authorization and booking-status safeguards.
-- Apply only after reviewing against the target database; do not run against production
-- until the migration is approved and backed up.

begin;

-- Booking statuses used by the application and payment outbox.
-- Fail explicitly if existing data contains an unrecognized value.
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
  add constraint bookings_status_allowed_check
  check (status in ('pending', 'confirmed', 'rejected', 'in_progress', 'completed', 'closed', 'cancelled'))
  not valid;

alter table public.bookings
  validate constraint bookings_status_allowed_check;

-- A normal authenticated user may create only customer/provider profiles and
-- may never promote their own role. Existing admins can manage roles.
create or replace function public.guard_profile_role_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then
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
drop trigger if exists profiles_guard_role_changes on public.profiles;
create trigger profiles_guard_role_changes
before insert or update on public.profiles
for each row execute function public.guard_profile_role_changes();

-- Provider users may edit business details but cannot approve or activate
-- themselves. Admins and trusted server-side service-role operations can.
create or replace function public.guard_provider_approval_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin(auth.uid()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Normalize user-created provider rows to the safe unapproved state.
    -- This preserves signup while preventing approval/activation spoofing.
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
drop trigger if exists provider_profiles_guard_approval on public.provider_profiles;
create trigger provider_profiles_guard_approval
before insert or update
on public.provider_profiles
for each row execute function public.guard_provider_approval_changes();

commit;
