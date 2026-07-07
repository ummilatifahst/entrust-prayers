-- =====================================================================
-- Migration 00 — Extensions & utility functions
-- =====================================================================
-- Aktifkan extension yang dibutuhkan:
--  - pgcrypto     : untuk gen_random_uuid()
--  - pg_trgm      : pencarian fuzzy text (fitur search pendoa)
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- updated_at helper
-- Fungsi untuk auto-update kolom updated_at pada setiap UPDATE.
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
