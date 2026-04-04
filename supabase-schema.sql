-- StellarPay Remittance Hub — Supabase Schema
-- Run this SQL in the Supabase SQL editor

create table users (
  id uuid primary key default gen_random_uuid(),
  stellar_public_key text unique not null,
  display_name text,
  email text,
  created_at timestamptz default now(),
  last_active_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_public_key text not null,
  stellar_tx_hash text unique,
  direction text check (direction in ('sent','received')),
  amount numeric,
  asset text default 'USDC',
  counterparty text,
  memo text,
  created_at timestamptz default now()
);

create table pending_transactions (
  id uuid primary key default gen_random_uuid(),
  vault_public_key text not null,
  creator_public_key text not null,
  xdr_payload text not null,
  required_signatures integer default 2,
  current_signatures integer default 1,
  status text check (status in ('pending', 'executed', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

create index idx_tx_user on transactions(user_public_key);
create index idx_tx_created on transactions(created_at);
create index idx_users_key on users(stellar_public_key);
create index idx_pending_vault on pending_transactions(vault_public_key);

-- Enable Row Level Security
alter table users enable row level security;
alter table transactions enable row level security;
alter table pending_transactions enable row level security;

-- RLS policies
create policy "Users can read own data" on users for select using (true);
create policy "Users can insert own record" on users for insert with check (true);
create policy "Anyone can read transactions" on transactions for select using (true);
create policy "Anyone can insert transactions" on transactions for insert with check (true);
create policy "Anyone can read pending txs" on pending_transactions for select using (true);
create policy "Anyone can insert pending txs" on pending_transactions for insert with check (true);
create policy "Anyone can update pending txs" on pending_transactions for update using (true);
