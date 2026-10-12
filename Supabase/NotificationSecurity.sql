-- Notification access controls for Mechanic Connect.
-- Apply in the Supabase SQL Editor after confirming public.notifications exists.
-- Notification inserts are performed server-side with the service-role client.
-- Authenticated users may read their own notifications and update only is_read.

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on table public.notifications from anon;
grant select on table public.notifications to authenticated;
revoke update on table public.notifications from authenticated;
grant update (is_read) on table public.notifications to authenticated;
