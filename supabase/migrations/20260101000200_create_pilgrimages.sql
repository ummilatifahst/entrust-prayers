-- =====================================================================
-- Migration 02 — Tabel pilgrimages (Perjalanan Ibadah)
-- =====================================================================

create type public.pilgrimage_type   as enum ('haji', 'umroh');
create type public.pilgrimage_status as enum ('draft', 'active', 'finished');

create table if not exists public.pilgrimages (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  type           public.pilgrimage_type   not null,
  departure_date date not null,
  return_date    date not null,
  description    text default '',
  status         public.pilgrimage_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.pilgrimages enable row level security;

-- Validasi: return_date harus setelah departure_date
alter table public.pilgrimages
  add constraint chk_pilgrimage_date_order
  check (return_date >= departure_date);

create index if not exists idx_pilgrimages_user      on public.pilgrimages (user_id);
create index if not exists idx_pilgrimages_status    on public.pilgrimages (status);
create index if not exists idx_pilgrimages_active_window
  on public.pilgrimages (status, departure_date, return_date);

drop trigger if exists trg_pilgrimages_updated_at on public.pilgrimages;
create trigger trg_pilgrimages_updated_at
  before update on public.pilgrimages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS Policies — pilgrimages
-- ---------------------------------------------------------------------
-- Pemilik bisa semua operasi. Publik (login) hanya SELECT yang status=active
-- agar pendoa aktif muncul di daftar publik.

drop policy if exists "pilgrimages_select_visible" on public.pilgrimages;
create policy "pilgrimages_select_visible"
  on public.pilgrimages for select
  using (
    user_id = auth.uid()
    or status = 'active'
  );

drop policy if exists "pilgrimages_insert_own" on public.pilgrimages;
create policy "pilgrimages_insert_own"
  on public.pilgrimages for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('pendoa', 'admin')
    )
  );

drop policy if exists "pilgrimages_update_own" on public.pilgrimages;
create policy "pilgrimages_update_own"
  on public.pilgrimages for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pilgrimages_delete_own" on public.pilgrimages;
create policy "pilgrimages_delete_own"
  on public.pilgrimages for delete
  using (user_id = auth.uid());
