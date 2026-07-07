-- =====================================================================
-- Migration 05 — Storage bucket untuk avatar & foto perjalanan
-- =====================================================================
-- Supabase Storage dipakai untuk upload foto profil & foto perjalanan.
-- Kebijakan: setiap user hanya bisa menulis/membaca di folder {uid}/...

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('pilgrimages', 'pilgrimages', true)
on conflict (id) do nothing;

-- Policy: avatar bisa dibaca semua user (public bucket)
drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Policy: pilgrimages bucket — sama polanya
drop policy if exists "pilgrimages_read_public" on storage.objects;
create policy "pilgrimages_read_public"
  on storage.objects for select
  using (bucket_id = 'pilgrimages');

drop policy if exists "pilgrimages_insert_own" on storage.objects;
create policy "pilgrimages_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'pilgrimages'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

drop policy if exists "pilgrimages_update_own" on storage.objects;
create policy "pilgrimages_update_own"
  on storage.objects for update
  using (
    bucket_id = 'pilgrimages'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

drop policy if exists "pilgrimages_delete_own" on storage.objects;
create policy "pilgrimages_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'pilgrimages'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );
