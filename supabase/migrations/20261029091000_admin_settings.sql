-- Platform settings required by the admin settings page.
-- Depends on the core schema migration and its current-user-only is_admin().

begin;

create table if not exists public.platform_settings (
  id text primary key default 'default' check (id = 'default'),
  general jsonb not null default jsonb_build_object(
    'platform_name', 'Mechanic Connect',
    'support_email', '',
    'support_phone', '',
    'default_region', 'Gauteng, South Africa'
  ),
  payments jsonb not null default jsonb_build_object(
    'platform_fee_percent', 15
  ),
  provider_management jsonb not null default jsonb_build_object(
    'require_approval', true,
    'service_categories', jsonb_build_array('Mechanic', 'Auto electrician', 'Panel beater')
  ),
  booking_rules jsonb not null default jsonb_build_object(
    'customer_cancellation_enabled', true
  ),
  notifications jsonb not null default jsonb_build_object(
    'email_enabled', true,
    'booking_updates', true,
    'quote_updates', true,
    'payment_updates', true,
    'completion_updates', true
  ),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
revoke all on table public.platform_settings from public, anon;
grant select, insert, update on table public.platform_settings to authenticated;

drop policy if exists "platform_settings_admin_select" on public.platform_settings;
create policy "platform_settings_admin_select"
on public.platform_settings
for select to authenticated
using (public.is_admin());

drop policy if exists "platform_settings_admin_insert" on public.platform_settings;
create policy "platform_settings_admin_insert"
on public.platform_settings
for insert to authenticated
with check (public.is_admin());

drop policy if exists "platform_settings_admin_update" on public.platform_settings;
create policy "platform_settings_admin_update"
on public.platform_settings
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.set_platform_settings_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists platform_settings_set_updated_at on public.platform_settings;
create trigger platform_settings_set_updated_at
before update on public.platform_settings
for each row execute function public.set_platform_settings_updated_at();

commit;
