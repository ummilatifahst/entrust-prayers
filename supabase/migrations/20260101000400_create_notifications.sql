-- =====================================================================
-- Migration 04 — Tabel notifications
-- =====================================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text default 'info',  -- info | prayer_accepted | prayer_prayed | new_prayer
  is_read     boolean not null default false,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

create index if not exists idx_notifications_user       on public.notifications (user_id);
create index if not exists idx_notifications_user_read  on public.notifications (user_id, is_read);
create index if not exists idx_notifications_created    on public.notifications (created_at desc);

-- ---------------------------------------------------------------------
-- RLS Policies — notifications
-- ---------------------------------------------------------------------
-- User hanya lihat & update notifikasi miliknya. Tidak boleh insert manual
-- dari client — semua insert via trigger SECURITY DEFINER di bawah.

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Tidak ada policy INSERT → RLS menolak insert dari client biasa.
-- Hanya function SECURITY DEFINER (di bawah) yang bisa insert.

-- ---------------------------------------------------------------------
-- Function helper: kirim notifikasi (dipakai trigger)
-- ---------------------------------------------------------------------
create or replace function public.notify_user(
  target_user_id uuid,
  p_title        text,
  p_message      text,
  p_type         text default 'info',
  p_metadata     jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (user_id, title, message, type, metadata)
  values (target_user_id, p_title, p_message, p_type, p_metadata);
end;
$$;

-- ---------------------------------------------------------------------
-- Trigger: ketika prayer status berubah → notifikasi sender
-- ---------------------------------------------------------------------
create or replace function public.prayer_status_change_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status <> old.status then
    if new.status = 'accepted' then
      perform public.notify_user(
        new.sender_id,
        'Doa Diterima',
        'Pendoa telah menerima titipan doa Anda dan akan segera didoakan.',
        'prayer_accepted',
        jsonb_build_object('prayer_id', new.id)
      );
    elseif new.status = 'prayed' then
      perform public.notify_user(
        new.sender_id,
        'Doa Sudah Didoakan',
        'Alhamdulillah, titipan doa Anda telah didoakan di Tanah Suci.',
        'prayer_prayed',
        jsonb_build_object('prayer_id', new.id)
      );
    elseif new.status = 'completed' then
      perform public.notify_user(
        new.sender_id,
        'Doa Selesai',
        'Titipan doa Anda telah diselesaikan.',
        'prayer_completed',
        jsonb_build_object('prayer_id', new.id)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prayer_status_notify on public.prayers;
create trigger trg_prayer_status_notify
  after update on public.prayers
  for each row execute function public.prayer_status_change_notify();

-- ---------------------------------------------------------------------
-- Trigger: ketika prayer baru → notifikasi receiver
-- ---------------------------------------------------------------------
create or replace function public.prayer_insert_notify()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.notify_user(
    new.receiver_id,
    'Titipan Doa Baru',
    'Anda menerima titipan doa baru. Periksa daftar titipan doa masuk.',
    'new_prayer',
    jsonb_build_object('prayer_id', new.id, 'sender_id', new.sender_id)
  );
  return new;
end;
$$;

drop trigger if exists trg_prayer_insert_notify on public.prayers;
create trigger trg_prayer_insert_notify
  after insert on public.prayers
  for each row execute function public.prayer_insert_notify();
