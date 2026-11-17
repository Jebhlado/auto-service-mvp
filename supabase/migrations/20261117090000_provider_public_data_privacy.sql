-- Provider public/private data boundary.
-- Public directory access is through a deliberately limited view. Private contact
-- details are available to the provider owner through a current-user-only RPC and
-- to trusted server-side admin operations using the service role.
begin;

do $$
begin
  if to_regclass('public.provider_profiles') is null then
    raise exception 'Required table public.provider_profiles does not exist';
  end if;
end;
$$;

create or replace view public.public_provider_directory
with (security_barrier = true, security_invoker = false)
as
select
  user_id,
  business_name,
  services,
  location,
  bio,
  years_experience,
  mobile_service,
  updated_at
from public.provider_profiles
where approval_status = 'approved'
  and is_active = true;

revoke all on table public.public_provider_directory from public, anon, authenticated;
grant select on table public.public_provider_directory to anon, authenticated;

-- Remove broad table-level SELECT and any column-level SELECT grants from the
-- public API roles. The view is the only anonymous directory surface.
revoke all privileges on table public.provider_profiles from anon;
revoke select on table public.provider_profiles from authenticated;

revoke select (
  user_id,
  business_name,
  services,
  location,
  contact_email,
  contact_phone,
  bio,
  approval_status,
  is_active,
  approved_at,
  created_at,
  updated_at,
  years_experience,
  mobile_service
) on table public.provider_profiles from anon, authenticated;

-- Authenticated users may read public profile attributes on rows allowed by RLS.
-- Private contact fields and approval timestamps are deliberately excluded.
grant select (
  user_id,
  business_name,
  services,
  location,
  bio,
  years_experience,
  mobile_service,
  approval_status,
  is_active,
  created_at,
  updated_at
) on table public.provider_profiles to authenticated;

create or replace function public.get_my_provider_profile()
returns setof public.provider_profiles
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select p.*
  from public.provider_profiles as p
  where p.user_id = auth.uid();
$$;

revoke all on function public.get_my_provider_profile() from public, anon;
grant execute on function public.get_my_provider_profile() to authenticated;

commit;
