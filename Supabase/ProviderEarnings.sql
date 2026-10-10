-- Provider earnings and payment-fee snapshots
-- Run once in the Supabase SQL Editor before deploying the earnings page.
-- New payments snapshot the fee rate used at creation; old rows are marked estimated_legacy.

alter table public.payments
  add column if not exists platform_fee_percent numeric(5,2),
  add column if not exists platform_fee_amount numeric(12,2),
  add column if not exists provider_amount numeric(12,2),
  add column if not exists fee_snapshot_source text;

do $$
declare
  current_fee numeric(5,2) := 15;
begin
  if to_regclass('public.platform_settings') is not null then
    execute $query$
      select coalesce(
        nullif(payments->>'platform_fee_percent', '')::numeric,
        15
      )
      from public.platform_settings
      where id = 'default'
      limit 1
    $query$ into current_fee;
  end if;

  current_fee := greatest(0, least(100, coalesce(current_fee, 15)));

  update public.payments
  set
    platform_fee_percent = current_fee,
    platform_fee_amount = round(coalesce(amount, 0)::numeric * current_fee / 100, 2),
    provider_amount = round(coalesce(amount, 0)::numeric, 2)
      - round(coalesce(amount, 0)::numeric * current_fee / 100, 2),
    fee_snapshot_source = 'estimated_legacy'
  where platform_fee_percent is null
     or platform_fee_amount is null
     or provider_amount is null
     or fee_snapshot_source is null;
end $$;

create or replace function public.snapshot_payment_fee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_fee numeric(5,2) := 15;
begin
  -- Preserve an existing snapshot when a payment status changes.
  if tg_op = 'UPDATE'
     and new.amount is not distinct from old.amount
     and old.platform_fee_percent is not null
     and old.platform_fee_amount is not null
     and old.provider_amount is not null then
    new.platform_fee_percent := old.platform_fee_percent;
    new.platform_fee_amount := old.platform_fee_amount;
    new.provider_amount := old.provider_amount;
    new.fee_snapshot_source := coalesce(old.fee_snapshot_source, 'payment_created');
    return new;
  end if;

  if to_regclass('public.platform_settings') is not null then
    execute $query$
      select coalesce(
        nullif(payments->>'platform_fee_percent', '')::numeric,
        15
      )
      from public.platform_settings
      where id = 'default'
      limit 1
    $query$ into current_fee;
  end if;

  current_fee := greatest(0, least(100, coalesce(current_fee, 15)));
  new.platform_fee_percent := current_fee;
  new.platform_fee_amount := round(coalesce(new.amount, 0)::numeric * current_fee / 100, 2);
  new.provider_amount := round(coalesce(new.amount, 0)::numeric, 2) - new.platform_fee_amount;
  new.fee_snapshot_source := 'payment_created';
  return new;
end;
$$;

drop trigger if exists payments_snapshot_fee on public.payments;
create trigger payments_snapshot_fee
before insert or update of amount, status on public.payments
for each row execute function public.snapshot_payment_fee();

comment on column public.payments.platform_fee_percent is
  'Platform fee percentage snapshotted when the payment row was created.';
comment on column public.payments.platform_fee_amount is
  'Platform share of the gross payment, rounded to cents.';
comment on column public.payments.provider_amount is
  'Provider share of the gross payment after platform fee, rounded to cents.';
comment on column public.payments.fee_snapshot_source is
  'payment_created for exact new snapshots; estimated_legacy for older payments backfilled using the configured rate at migration time.';
