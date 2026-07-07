-- =====================================================================
-- AGGREGATE — jalankan file ini untuk run semua migration sekaligus
-- =====================================================================
-- Pemakaian:
--   psql "$DATABASE_URL" -f supabase/migrations/000_run_all.sql
-- =====================================================================
\i 20260101000000_create_extensions.sql
\i 20260101000100_create_profiles.sql
\i 20260101000200_create_pilgrimages.sql
\i 20260101000300_create_prayers.sql
\i 20260101000400_create_notifications.sql
\i 20260101000500_storage_bucket.sql
\i 20260101000600_enable_realtime.sql
\i 20260101000700_prayer_status_rpc.sql
\i 20260101000800_admin_functions.sql
