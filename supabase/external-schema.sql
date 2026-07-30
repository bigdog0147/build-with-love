-- =====================================================================
-- Gigafactory 3X — full application schema
-- Target: the EXTERNAL Supabase project (qoxnctanpljukzkdeekj)
-- Run once in that project's SQL editor. Safe to re-run (idempotent).
--
-- After running this, the external project has the same shape as the
-- primary backend: auth-linked profiles, wallets, transactions, cards,
-- allocations, KYC, roles, social links, metrics and rate limiting.
-- =====================================================================

-- ---------- enums ----------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kyc_doc_type as enum ('passport', 'national_id', 'drivers_license', 'residence_permit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.kyc_status as enum ('not_started', 'submitted', 'under_review', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------- shared helpers -------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------- profiles --------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key,
  display_name text not null default 'Client',
  tier text not null default 'Obsidian',
  initials text not null default 'CL',
  avatar_url text,
  first_name text,
  last_name text,
  phone text,
  country text,
  organization text,
  username text,
  interests text[] not null default '{}',
  role text not null default 'Research Member',
  membership text not null default 'Standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- roles (never store roles on profiles) ---------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
drop policy if exists "Users can read own roles" on public.user_roles;
create policy "Users can read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- ---------- wallets ---------------------------------------------------
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code text not null,
  label text not null,
  balance numeric not null default 0,
  fiat_value numeric,
  delta_pct numeric not null default 0,
  tint text not null default 'gold',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
drop policy if exists "Users manage own wallets" on public.wallets;
create policy "Users manage own wallets" on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- transactions ---------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  kind text not null,
  amount numeric not null,
  currency text not null default 'USD',
  occurred_at timestamptz not null default now(),
  status text not null default 'Cleared',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- cards -----------------------------------------------------
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  last4 text not null,
  tier text not null,
  gradient text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.cards to authenticated;
grant all on public.cards to service_role;
alter table public.cards enable row level security;
drop policy if exists "Users manage own cards" on public.cards;
create policy "Users manage own cards" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- allocations ----------------------------------------------
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  label text not null,
  percent numeric not null,
  color text not null,
  sort_order integer not null default 0
);
grant select, insert, update, delete on public.allocations to authenticated;
grant all on public.allocations to service_role;
alter table public.allocations enable row level security;
drop policy if exists "Users manage own allocations" on public.allocations;
create policy "Users manage own allocations" on public.allocations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- KYC -------------------------------------------------------
create table if not exists public.kyc_profiles (
  user_id uuid primary key,
  full_legal_name text,
  date_of_birth date,
  nationality text,
  country_of_residence text,
  residential_address text,
  postal_code text,
  doc_type public.kyc_doc_type,
  doc_front_path text,
  doc_back_path text,
  selfie_path text,
  id_status public.kyc_status not null default 'not_started',
  email_verified boolean not null default false,
  phone_number text,
  phone_verified boolean not null default false,
  tax_country text,
  source_of_funds text,
  expected_usage text,
  two_factor_enabled boolean not null default false,
  recovery_email text,
  current_step integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.kyc_profiles to authenticated;
grant all on public.kyc_profiles to service_role;
alter table public.kyc_profiles enable row level security;
drop policy if exists "Users manage own kyc" on public.kyc_profiles;
create policy "Users manage own kyc" on public.kyc_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop trigger if exists set_kyc_updated_at on public.kyc_profiles;
create trigger set_kyc_updated_at before update on public.kyc_profiles
  for each row execute function public.set_updated_at();

-- ---------- social links (admin-managed, public read) -----------------
create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  network text not null,
  label text not null,
  url text not null default '',
  handle text,
  icon_key text not null default 'link',
  is_visible boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.social_links to anon;
grant select, insert, update, delete on public.social_links to authenticated;
grant all on public.social_links to service_role;
alter table public.social_links enable row level security;
drop policy if exists "Visible social links are public" on public.social_links;
create policy "Visible social links are public" on public.social_links
  for select using (is_visible = true and url <> '');
drop policy if exists "Admins read all social links" on public.social_links;
create policy "Admins read all social links" on public.social_links
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins insert social links" on public.social_links;
create policy "Admins insert social links" on public.social_links
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins update social links" on public.social_links;
create policy "Admins update social links" on public.social_links
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "Admins delete social links" on public.social_links;
create policy "Admins delete social links" on public.social_links
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
drop trigger if exists set_social_links_updated_at on public.social_links;
create trigger set_social_links_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

-- ---------- public marketing metrics ----------------------------------
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value numeric not null default 0,
  suffix text not null default '',
  decimals integer not null default 0,
  sub text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.metrics to anon, authenticated;
grant all on public.metrics to service_role;
alter table public.metrics enable row level security;
drop policy if exists "Metrics are public read" on public.metrics;
create policy "Metrics are public read" on public.metrics for select using (true);

-- ---------- audit + rate limiting (deny-all to clients) ---------------
create table if not exists public.auth_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid,
  email_hash text,
  email_masked text,
  ip text,
  user_agent text,
  success boolean not null default true,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.auth_audit_log to authenticated;
grant all on public.auth_audit_log to service_role;
alter table public.auth_audit_log enable row level security;
drop policy if exists "Users read own audit rows" on public.auth_audit_log;
create policy "Users read own audit rows" on public.auth_audit_log
  for select to authenticated using (auth.uid() = user_id);

create table if not exists public.reset_rate_limits (
  id uuid primary key default gen_random_uuid(),
  key_type text not null,
  key_value text not null,
  attempted_at timestamptz not null default now()
);
grant all on public.reset_rate_limits to service_role;
alter table public.reset_rate_limits enable row level security;
-- intentionally no policies: server-side (service role) access only

-- ---------- new-user bootstrap ---------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text := nullif(meta->>'first_name', '');
  v_last text := nullif(meta->>'last_name', '');
  v_full text := nullif(meta->>'full_name', '');
  v_display text;
  v_initials text;
begin
  v_display := coalesce(
    nullif(trim(concat_ws(' ', v_first, v_last)), ''),
    v_full, split_part(new.email, '@', 1), 'Member');
  v_initials := upper(coalesce(
    nullif(left(coalesce(v_first, v_display), 1), '') || nullif(left(coalesce(v_last, ''), 1), ''),
    left(v_display, 2)));

  insert into public.profiles (
    id, display_name, initials, tier, first_name, last_name, phone,
    country, organization, username, interests, role, membership)
  values (
    new.id, v_display, v_initials, 'Standard', v_first, v_last,
    nullif(meta->>'phone', ''), nullif(meta->>'country', ''),
    nullif(meta->>'organization', ''), nullif(meta->>'username', ''),
    coalesce(array(select jsonb_array_elements_text(meta->'interests')), '{}'::text[]),
    'Research Member', 'Standard')
  on conflict (id) do nothing;

  insert into public.kyc_profiles (user_id, phone_number)
  values (new.id, nullif(meta->>'phone', ''))
  on conflict (user_id) do nothing;

  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Attach the trigger (requires owner privileges on auth.users; run in the
-- SQL editor of the external project, which has them).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- storage ---------------------------------------------------
-- Create a PRIVATE bucket named `kyc-documents` in Storage first, then:
drop policy if exists "Users manage own kyc documents" on storage.objects;
create policy "Users manage own kyc documents" on storage.objects
  for all to authenticated
  using (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
