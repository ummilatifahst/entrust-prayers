-- =====================================================================
-- Migration 08 — Admin functions (role management, broadcast, RLS)
-- =====================================================================
-- Menambahkan:
--   1. RPC admin_set_user_role(target, new_role)
--      - Cegah self-role-change (admin tidak bisa ubah role sendiri)
--      - Cegah demote admin terakhir (harus selalu ada ≥ 1 admin)
--   2. RPC admin_broadcast_notification(title, message) — kirim ke semua user
--   3. RPC admin_send_notification(target, title, message, type) — ke 1 user
--   4. RPC admin_delete_user(target) — hapus user sepenuhnya (auth.users + profile)
--   5. RPC admin_stats() — agregasi untuk dashboard
--   6. RLS: admin bisa update/delete pilgrimages & profiles milik siapa saja
--   7. REVOKE column-level UPDATE pada profiles.role → wajib lewat RPC
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. admin_set_user_role — ubah role user lain
-- ---------------------------------------------------------------------
create or replace function public.admin_set_user_role(
  p_target_user_id uuid,
  p_new_role       public.user_role
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_target_role public.user_role;
  v_admin_count integer;
begin
  if auth.uid() is null then
    raise exception 'Anda harus login' using errcode = '42501';
  end if;

  if not public.is_admin(auth.uid()) then
    raise exception 'Hanya admin yang dapat mengubah role user' using errcode = '42501';
  end if;

  -- Tidak boleh ubah role sendiri (cegah self-promotion/demotion)
  if auth.uid() = p_target_user_id then
    raise exception 'Anda tidak dapat mengubah role sendiri' using errcode = 'P0003';
  end if;

  select role into v_target_role
  from public.profiles
  where id = p_target_user_id;

  if not found then
    raise exception 'User tidak ditemukan' using errcode = 'P0002';
  end if;

  -- Cegah demote admin terakhir
  if v_target_role = 'admin' and p_new_role <> 'admin' then
    select count(*) into v_admin_count
    from public.profiles
    where role = 'admin';

    if v_admin_count <= 1 then
      raise exception 'Tidak dapat menurunkan admin terakhir. Promosikan user lain menjadi admin terlebih dahulu.' using errcode = 'P0003';
    end if;
  end if;

  update public.profiles
  set role = p_new_role
  where id = p_target_user_id;
end;
$$;

comment on function public.admin_set_user_role(uuid, public.user_role) is
'Mengubah role user lain. Hanya admin. Tidak bisa ubah role sendiri atau demote admin terakhir.';

-- ---------------------------------------------------------------------
-- 2. admin_broadcast_notification — kirim ke SEMUA user (kecuali pengirim)
-- ---------------------------------------------------------------------
create or replace function public.admin_broadcast_notification(
  p_title   text,
  p_message text,
  p_type    text default 'info'
)
returns integer  -- jumlah penerima
language plpgsql
security definer set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Hanya admin yang dapat broadcast notifikasi' using errcode = '42501';
  end if;

  if length(btrim(p_title)) = 0 or length(btrim(p_message)) = 0 then
    raise exception 'Judul dan pesan tidak boleh kosong' using errcode = 'P0003';
  end if;

  insert into public.notifications (user_id, title, message, type, metadata)
  select id, p_title, p_message, p_type,
         jsonb_build_object('from', 'admin_broadcast', 'sent_by', auth.uid())
  from public.profiles
  where id <> auth.uid();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. admin_send_notification — kirim ke 1 user spesifik
-- ---------------------------------------------------------------------
create or replace function public.admin_send_notification(
  p_target_user_id uuid,
  p_title          text,
  p_message        text,
  p_type           text default 'info'
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Hanya admin yang dapat mengirim notifikasi' using errcode = '42501';
  end if;

  perform public.notify_user(
    p_target_user_id,
    p_title,
    p_message,
    p_type,
    jsonb_build_object('from', 'admin', 'sent_by', auth.uid())
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 4. admin_delete_user — hapus user sepenuhnya (auth.users + cascade)
-- ---------------------------------------------------------------------
create or replace function public.admin_delete_user(
  p_target_user_id uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_target_role public.user_role;
  v_admin_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Hanya admin yang dapat menghapus user' using errcode = '42501';
  end if;

  if auth.uid() = p_target_user_id then
    raise exception 'Anda tidak dapat menghapus akun sendiri' using errcode = 'P0003';
  end if;

  select role into v_target_role
  from public.profiles
  where id = p_target_user_id;

  if not found then
    raise exception 'User tidak ditemukan' using errcode = 'P0002';
  end if;

  -- Cegah hapus admin terakhir
  if v_target_role = 'admin' then
    select count(*) into v_admin_count
    from public.profiles
    where role = 'admin';

    if v_admin_count <= 1 then
      raise exception 'Tidak dapat menghapus admin terakhir' using errcode = 'P0003';
    end if;
  end if;

  -- Hapus dari auth.users → trigger CASCADE akan hapus profile, prayers, pilgrimages
  delete from auth.users where id = p_target_user_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. admin_stats — agregasi untuk dashboard admin
-- ---------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_total_users       integer;
  v_penitip_count     integer;
  v_pendoa_count      integer;
  v_admin_count       integer;
  v_total_pilgrimages integer;
  v_active_pilgrimages integer;
  v_total_prayers     integer;
  v_prayers_pending   integer;
  v_prayers_accepted  integer;
  v_prayers_prayed    integer;
  v_prayers_completed integer;
  v_total_notifications integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Hanya admin' using errcode = '42501';
  end if;

  select
    count(*),
    count(*) filter (where role = 'penitip'),
    count(*) filter (where role = 'pendoa'),
    count(*) filter (where role = 'admin')
  into v_total_users, v_penitip_count, v_pendoa_count, v_admin_count
  from public.profiles;

  select
    count(*),
    count(*) filter (where status = 'active')
  into v_total_pilgrimages, v_active_pilgrimages
  from public.pilgrimages;

  select
    count(*),
    count(*) filter (where status = 'pending'),
    count(*) filter (where status = 'accepted'),
    count(*) filter (where status = 'prayed'),
    count(*) filter (where status = 'completed')
  into v_total_prayers, v_prayers_pending, v_prayers_accepted, v_prayers_prayed, v_prayers_completed
  from public.prayers;

  select count(*) into v_total_notifications from public.notifications;

  return jsonb_build_object(
    'users', jsonb_build_object(
      'total', v_total_users,
      'penitip', v_penitip_count,
      'pendoa', v_pendoa_count,
      'admin', v_admin_count
    ),
    'pilgrimages', jsonb_build_object(
      'total', v_total_pilgrimages,
      'active', v_active_pilgrimages
    ),
    'prayers', jsonb_build_object(
      'total', v_total_prayers,
      'pending', v_prayers_pending,
      'accepted', v_prayers_accepted,
      'prayed', v_prayers_prayed,
      'completed', v_prayers_completed
    ),
    'notifications', jsonb_build_object(
      'total', v_total_notifications
    )
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 6. RLS updates — admin bisa manage semua data
-- ---------------------------------------------------------------------

-- Profiles: admin bisa update semua profile, tapi REVOKE column role
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (
    auth.uid() = id
    or public.is_admin(auth.uid())
  )
  with check (
    auth.uid() = id
    or public.is_admin(auth.uid())
  );

-- Profiles delete: admin juga
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_owner_or_admin"
  on public.profiles for delete
  using (
    auth.uid() = id
    or public.is_admin(auth.uid())
  );

-- Column-level privilege: REVOKE update pada role dari client
-- Semua perubahan role wajib via admin_set_user_role RPC
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, city, bio) on public.profiles to anon, authenticated;

-- Pilgrimages: admin bisa update/delete semua
drop policy if exists "pilgrimages_update_own" on public.pilgrimages;
create policy "pilgrimages_update_owner_or_admin"
  on public.pilgrimages for update
  using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
  )
  with check (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
  );

drop policy if exists "pilgrimages_delete_own" on public.pilgrimages;
create policy "pilgrimages_delete_owner_or_admin"
  on public.pilgrimages for delete
  using (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- Pilgrimages insert: admin juga bisa insert untuk user lain (mis. testing)
drop policy if exists "pilgrimages_insert_own" on public.pilgrimages;
create policy "pilgrimages_insert_own_or_admin"
  on public.pilgrimages for insert
  with check (
    user_id = auth.uid()
    or public.is_admin(auth.uid())
  );

-- Prayers: admin bisa delete semua (sudah ada di policy sebelumnya, tetap dipakai)
-- Prayers update sudah include admin via prayers_update_participants
