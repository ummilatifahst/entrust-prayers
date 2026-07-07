-- =====================================================================
-- Migration 06 — Enable Realtime publication
-- =====================================================================
-- Supabase Realtime hanya mengirim event untuk tabel yang dipublikasikan
-- di publication `supabase_realtime`. Tambahkan prayers & notifications.
-- =====================================================================

alter publication supabase_realtime add table public.prayers;
alter publication supabase_realtime add table public.notifications;
