-- Provider public/private data boundary.
-- Public directory access is through a limited view.
-- Private contact details are available to the provider owner
-- through a current-user-only RPC and trusted server-side operations.

begin;

-- Verify the required table exists.
do $$
begin
  if to_regclass('public.provider_profiles') is null then
    raise exception 'Required table public.provider_profiles does not exist';
  end if;
end;
$$;

-- Align the repository schema with the existing live database.
alter table public.provider_profiles
  add column if not exists years_experience text;

alter table public.provider_profiles
  add column if not exists mobile_service boolean;

-- Create the restricted public directory.
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

-- The view must have a trusted owner.
alter view public.public_provider_directory owner to postgres;

-- Only expose the public directory to API roles.
revoke all privileges
on table public.public_provider_directory
from PUBLIC, anon, authenticated;

grant select
on table public.public_provider_directory
to anon, authenticated;

-- Remove broad table-level permissions.
revoke all privileges
on table public.provider_profiles
from PUBLIC, anon;

revoke select
on table public.provider_profiles
from authenticated;

-- Remove column-level SELECT permissions, including inherited PUBLIC grants.
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
)
on table public.provider_profiles
from PUBLIC, anon, authenticated;

-- Restore only approved public metadata access for authenticated users.
grant select (
  user_id,
  business_name,
  services,
  location,
  bio,
  years_experience,
  mobile_service,
  created_at,
  updated_at
)
on table public.provider_profiles
to authenticated;

-- A provider can retrieve only their own complete profile.
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

alter function public.get_my_provider_profile() owner to postgres;

revoke all
on function public.get_my_provider_profile()
from PUBLIC, anon;

grant execute
on function public.get_my_provider_profile()
to authenticated;

commit;
