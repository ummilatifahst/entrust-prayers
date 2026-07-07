-- =====================================================================
-- Migration 03 — Tabel prayers (Titipan Doa)
-- =====================================================================

create type public.prayer_status as enum ('pending', 'accepted', 'prayed', 'completed');

create table if not exists public.prayers (
  id             uuid primary key default gen_random_uuid(),
  sender_id      uuid not null references public.profiles (id) on delete cascade,
  receiver_id    uuid not null references public.profiles (id) on delete cascade,
  pilgrimage_id  uuid references public.pilgrimages (id) on delete set null,

  title          text not null,
  content        text not null,

  is_private     boolean not null default false,  -- hanya sender & receiver yang lihat
  is_anonymous   boolean not null default false,  -- sembunyikan nama sender di listing receiver

  status         public.prayer_status not null default 'pending',
  prayed_at      timestamptz,
  completed_at   timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.prayers enable row level security;

-- Constraint: title & content tidak boleh kosong
alter table public.prayers
  add constraint chk_prayer_title_not_empty   check (length(btrim(title))   > 0),
  add constraint chk_prayer_content_not_empty check (length(btrim(content)) > 0);

create index if not exists idx_prayers_sender     on public.prayers (sender_id);
create index if not exists idx_prayers_receiver   on public.prayers (receiver_id);
create index if not exists idx_prayers_pilgrimage on public.prayers (pilgrimage_id);
create index if not exists idx_prayers_status     on public.prayers (status);
create index if not exists idx_prayers_created    on public.prayers (created_at desc);

drop trigger if exists trg_prayers_updated_at on public.prayers;
create trigger trg_prayers_updated_at
  before update on public.prayers
  for each row execute function public.set_updated_at();

-- Auto-set prayed_at ketika status berubah ke 'prayed'
create or replace function public.set_prayed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'prayed' and old.status <> 'prayed' and new.prayed_at is null then
    new.prayed_at = now();
  end if;
  if new.status = 'completed' and old.status <> 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prayers_status_change on public.prayers;
create trigger trg_prayers_status_change
  before update on public.prayers
  for each row execute function public.set_prayed_at();

-- ---------------------------------------------------------------------
-- RLS Policies — prayers
-- ---------------------------------------------------------------------
-- Aturan visibilitas:
--  1. Sender selalu lihat doa miliknya.
--  2. Receiver lihat doa yang ditujukan ke dia (kecuali yang status-nya 'completed' & private).
--  3. Jika is_private = true, HANYA sender & receiver yang bisa lihat.
--  4. Admin punya akses penuh.

drop policy if exists "prayers_select_participants" on public.prayers;
create policy "prayers_select_participants"
  on public.prayers for select
  using (
    sender_id   = auth.uid()
    or receiver_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Insert: hanya penitip (atau admin), receiver tidak boleh = sender
drop policy if exists "prayers_insert_sender" on public.prayers;
create policy "prayers_insert_sender"
  on public.prayers for insert
  with check (
    sender_id    = auth.uid()
    and receiver_id <> auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('penitip', 'admin')
    )
  );

-- Update: sender bisa update field content/title (masih pending).
-- Receiver hanya boleh update status (accept/pray).
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

drop policy if exists "prayers_update_participants" on public.prayers;
create policy "prayers_update_participants"
  on public.prayers for update
  using (
    sender_id   = auth.uid()
    or receiver_id = auth.uid()
    or public.is_admin(auth.uid())
  )
  with check (
    sender_id   = auth.uid()
    or receiver_id = auth.uid()
    or public.is_admin(auth.uid())
  );

drop policy if exists "prayers_delete_sender" on public.prayers;
create policy "prayers_delete_sender"
  on public.prayers for delete
  using (
    sender_id = auth.uid()
    or public.is_admin(auth.uid())
  );
