-- Provider earnings fee snapshots, compatible with the existing payments schema.
-- Preserves the existing platform_fee and provider_amount values.
-- Run once in the Supabase SQL Editor before deploying the earnings page.

alter table public.payments
  add column if not exists platform_fee_percent numeric(5,2),
  add column if not exists fee_snapshot_source text;

-- Derive historical percentages from the stored amounts; do not recalculate or overwrite money values.
update public.payments
set
  platform_fee_percent = case
    when amount > 0 then round((platform_fee / amount * 100)::numeric, 2)
    else 0
  end,
  fee_snapshot_source = 'existing_record'
where platform_fee_percent is null
   or fee_snapshot_source is null;

create or replace function public.snapshot_payment_fee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_fee numeric(5,2) := 15;
begin
  -- Preserve the recorded amounts and fee snapshot for status-only updates.
  if tg_op = 'UPDATE'
     and new.amount is not distinct from old.amount
     and old.platform_fee_percent is not null then
    new.platform_fee := old.platform_fee;
    new.provider_amount := old.provider_amount;
    new.platform_fee_percent := old.platform_fee_percent;
    new.fee_snapshot_source := coalesce(old.fee_snapshot_source, 'existing_record');
    return new;
  end if;

  -- Use the configured platform fee where available; fall back to 15%.
  if to_regclass('public.platform_settings') is not null then
    execute $query$
      select coalesce(nullif(payments->>'platform_fee_percent', '')::numeric, 15)
      from public.platform_settings
      where id = 'default'
      limit 1
    $query$ into current_fee;
  end if;

  current_fee := greatest(0, least(100, coalesce(current_fee, 15)));
  new.platform_fee_percent := current_fee;
  new.platform_fee := round(coalesce(new.amount, 0)::numeric * current_fee / 100, 2);
  new.provider_amount := round(coalesce(new.amount, 0)::numeric, 2) - new.platform_fee;
  new.fee_snapshot_source := 'payment_created';
  return new;
end;
$$;

drop trigger if exists payments_snapshot_fee on public.payments;
create trigger payments_snapshot_fee
before insert or update of amount, status on public.payments
for each row execute function public.snapshot_payment_fee();

comment on column public.payments.platform_fee_percent is
  'Platform fee percentage recorded for this payment; historical values are derived from the existing fee amounts.';
comment on column public.payments.fee_snapshot_source is
  'existing_record for values preserved from historical payment records; payment_created for new snapshots.';
