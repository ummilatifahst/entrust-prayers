-- =====================================================================
-- Migration 01 — Tabel profiles
-- =====================================================================
-- Di-join 1:1 dengan auth.users (Supabase Auth).
-- Role: penitip | pendoa | admin
-- ---------------------------------------------------------------------

create type public.user_role as enum ('penitip', 'pendoa', 'admin');

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  avatar_url   text,
  city         text default '',
  bio          text default '',
  role         public.user_role not null default 'penitip',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles
  enable row level security;

-- Index untuk pencarian pendoa berdasarkan kota & role
create index if not exists idx_profiles_role_city
  on public.profiles (role, city);

create index if not exists idx_profiles_full_name_trgm
  on public.profiles using gin (full_name gin_trgm_ops);

-- Trigger: auto-update updated_at
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Trigger: auto-buat profile ketika user baru register di auth.users
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'penitip')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RLS Policies — profiles
-- ---------------------------------------------------------------------
-- Semua user bisa melihat profile pendoa (untuk daftar pendoa aktif).
-- Tapi data sensitif (email) tetap perlu hati-hati — di-limit via SELECT.
-- User hanya bisa update profile miliknya. Admin bisa semua.

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);
