-- StellarPay Remittance Hub — Incremental security hardening migration
-- Use this on an existing Supabase project where the base tables already exist.

create extension if not exists "pgcrypto" with schema extensions;

create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_public_key text,
  target_public_key text,
  route text not null,
  outcome text check (outcome in ('success', 'failure')) not null,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_security_events_created on security_events(created_at desc);
create index if not exists idx_security_events_action on security_events(action);

alter table users enable row level security;
alter table transactions enable row level security;
alter table pending_transactions enable row level security;
alter table security_events enable row level security;

revoke all on table users from anon, authenticated;
revoke all on table transactions from anon, authenticated;
revoke all on table pending_transactions from anon, authenticated;
revoke all on table security_events from anon, authenticated;

drop policy if exists "Users can read own data" on users;
drop policy if exists "Users can insert own record" on users;
drop policy if exists "Anyone can read transactions" on transactions;
drop policy if exists "Anyone can insert transactions" on transactions;
drop policy if exists "Anyone can read pending txs" on pending_transactions;
drop policy if exists "Anyone can insert pending txs" on pending_transactions;
drop policy if exists "Anyone can update pending txs" on pending_transactions;
drop policy if exists "Block direct client reads on users" on users;
drop policy if exists "Block direct client writes on users" on users;
drop policy if exists "Block direct client transaction reads" on transactions;
drop policy if exists "Block direct client transaction writes" on transactions;
drop policy if exists "Block direct client pending tx reads" on pending_transactions;
drop policy if exists "Block direct client pending tx inserts" on pending_transactions;
drop policy if exists "Block direct client pending tx updates" on pending_transactions;
drop policy if exists "Block direct client security event reads" on security_events;
drop policy if exists "Block direct client security event writes" on security_events;

create policy "Block direct client reads on users"
  on users for select
  using (false);

create policy "Block direct client writes on users"
  on users for insert
  with check (false);

create policy "Block direct client transaction reads"
  on transactions for select
  using (false);

create policy "Block direct client transaction writes"
  on transactions for insert
  with check (false);

create policy "Block direct client pending tx reads"
  on pending_transactions for select
  using (false);

create policy "Block direct client pending tx inserts"
  on pending_transactions for insert
  with check (false);

create policy "Block direct client pending tx updates"
  on pending_transactions for update
  using (false);

create policy "Block direct client security event reads"
  on security_events for select
  using (false);

create policy "Block direct client security event writes"
  on security_events for insert
  with check (false);
