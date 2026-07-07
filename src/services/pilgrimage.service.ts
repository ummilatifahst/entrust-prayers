import { supabase } from './supabase'
import type {
  Pilgrimage,
  PilgrimageInput,
  PilgrimageWithPendoa,
} from '@/types/database'
import { TABLE } from './constants'

/** Buat perjalanan baru milik user yang sedang login. */
export async function createPilgrimage(
  userId: string,
  payload: PilgrimageInput
): Promise<Pilgrimage> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .insert({ ...payload, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Pilgrimage
}

/** Update pilgrimage milik user. */
export async function updatePilgrimage(
  id: string,
  payload: Partial<PilgrimageInput>
): Promise<Pilgrimage> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Pilgrimage
}

export async function deletePilgrimage(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE.pilgrimages).delete().eq('id', id)
  if (error) throw error
}

/** Ambil semua perjalanan milik user (urutkan berdasarkan created_at desc). */
export async function fetchMyPilgrimages(userId: string): Promise<Pilgrimage[]> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Pilgrimage[]
}

/** Ambil satu pilgrimage by id (harus milik user atau berstatus active). */
export async function fetchPilgrimageById(id: string): Promise<Pilgrimage | null> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Pilgrimage | null
}

/**
 * Listing pendoa aktif untuk halaman publik penitip.
 * Join manual ke profiles untuk data pendoa.
 */
export async function fetchActivePilgrimages(): Promise<PilgrimageWithPendoa[]> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .select(`
      *,
      pendoa:profiles!pilgrimages_user_id_fkey (
        id, full_name, avatar_url, city, bio
      )
    `)
    .eq('status', 'active')
    .order('departure_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PilgrimageWithPendoa[]
}

export async function fetchPilgrimageDetail(
  id: string
): Promise<PilgrimageWithPendoa | null> {
  const { data, error } = await supabase
    .from(TABLE.pilgrimages)
    .select(`
      *,
      pendoa:profiles!pilgrimages_user_id_fkey (
        id, full_name, avatar_url, city, bio
      )
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as PilgrimageWithPendoa | null
}
