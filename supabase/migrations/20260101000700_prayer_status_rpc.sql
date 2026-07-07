-- =====================================================================
-- Migration 07 — Role-based prayer status via RPC + column-level lock
-- =====================================================================
-- Aturan (di-enforce di database, bukan hanya UI):
--   pending  → accepted   | HANYA receiver (pendoa)
--   *        → prayed     | HANYA receiver (pendoa)
--   prayed   → completed  | HANYA sender   (penitip)
--   accepted → pending    | HANYA sender   (penitip) — batal
--
-- Strategi:
--   1. RPC function SECURITY DEFINER `update_prayer_status(p_prayer_id, p_new_status)`
--      yang validasi role + transisi.
--   2. REVOKE UPDATE pada kolom `status` dari anon/authenticated → client
--      TIDAK bisa update status langsung. Wajib lewat RPC.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. RPC function untuk update status prayer
-- ---------------------------------------------------------------------
create or replace function public.update_prayer_status(
  p_prayer_id   uuid,
  p_new_status  public.prayer_status
)
returns public.prayers
language plpgsql
security definer set search_path = public
as $$
declare
  v_prayer      public.prayers;
  v_caller      uuid := auth.uid();
  v_is_sender   boolean;
  v_is_receiver boolean;
  v_is_admin    boolean;
begin
  if v_caller is null then
    raise exception 'Anda harus login' using errcode = '42501';
  end if;

  select * into v_prayer
  from public.prayers
  where id = p_prayer_id;

  if not found then
    raise exception 'Doa tidak ditemukan' using errcode = 'P0002';
  end if;

  v_is_sender   := (v_prayer.sender_id   = v_caller);
  v_is_receiver := (v_prayer.receiver_id = v_caller);
  v_is_admin    := public.is_admin(v_caller);

  -- Access control: hanya sender/receiver/admin yang boleh
  if not (v_is_sender or v_is_receiver or v_is_admin) then
    raise exception 'Anda tidak memiliki akses ke doa ini' using errcode = '42501';
  end if;

  -- Skip jika tidak ada perubahan
  if v_prayer.status = p_new_status then
    return v_prayer;
  end if;

  -- ---------------------------------------------------------------
  -- State machine validation
  -- ---------------------------------------------------------------
  -- pending → accepted : HANYA receiver
  if p_new_status = 'accepted' then
    if v_prayer.status <> 'pending' then
      raise exception 'Doa harus berstatus Menunggu untuk dapat diterima' using errcode = 'P0003';
    end if;
    if not (v_is_receiver or v_is_admin) then
      raise exception 'HANYA pendoa (penerima) yang berhak menerima doa' using errcode = '42501';
    end if;

  -- * → prayed : HANYA receiver
  elsif p_new_status = 'prayed' then
    if v_prayer.status not in ('pending', 'accepted') then
      raise exception 'Doa harus berstatus Menunggu atau Diterima untuk ditandai sudah didoakan' using errcode = 'P0003';
    end if;
    if not (v_is_receiver or v_is_admin) then
      raise exception 'HANYA pendoa yang berhak menandai doa sudah didoakan' using errcode = '42501';
    end if;

  -- prayed → completed : HANYA sender
  elsif p_new_status = 'completed' then
    if v_prayer.status <> 'prayed' then
      raise exception 'Doa harus sudah didoakan sebelum dapat diselesaikan' using errcode = 'P0003';
    end if;
    if not (v_is_sender or v_is_admin) then
      raise exception 'HANYA penitip (pengirim) yang berhak menyelesaikan doa' using errcode = '42501';
    end if;

  -- accepted → pending : HANYA sender (batal)
  elsif p_new_status = 'pending' then
    if v_prayer.status not in ('accepted') then
      raise exception 'Hanya doa yang sudah diterima yang dapat dibatalkan' using errcode = 'P0003';
    end if;
    if not (v_is_sender or v_is_admin) then
      raise exception 'HANYA penitip yang berhak membatalkan doa' using errcode = '42501';
    end if;

  else
    raise exception 'Status tidak valid: %', p_new_status using errcode = 'P0003';
  end if;

  -- Apply update (auto-set timestamps via trigger yg sudah ada)
  update public.prayers
  set status = p_new_status
  where id = p_prayer_id
  returning * into v_prayer;

  return v_prayer;
end;
$$;

-- Beri komentar untuk dokumentasi
comment on function public.update_prayer_status(uuid, public.prayer_status) is
'Update status doa dengan validasi role + transisi. Hanya pendoa yang bisa accept/pray, hanya penitip yang bisa complete/cancel.';

-- ---------------------------------------------------------------------
-- 2. REVOKE update pada kolom status dari client roles
--    Ini memaksa semua perubahan status lewat RPC function di atas.
-- ---------------------------------------------------------------------
-- PostgreSQL column-level privileges:
--   revoke update (status) dari anon & authenticated
--  grant update tetap di kolom non-status (title, content, is_private, is_anonymous)

revoke update on public.prayers from anon, authenticated;
grant update (title, content, is_private, is_anonymous) on public.prayers to anon, authenticated;

-- Pastikan INSERT & SELECT tetap berjalan
grant select, insert on public.prayers to anon, authenticated;
grant delete on public.prayers to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Drop trigger status-change yang lama (sudah digantikan RPC + masih handle prayed_at)
--    Trigger lama `set_prayed_at` masih relevan untuk timestamp otomatis.
--    Tidak ada yang diubah di trigger — biarkan jalan.
-- ---------------------------------------------------------------------
