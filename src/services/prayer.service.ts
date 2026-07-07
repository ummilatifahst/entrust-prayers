import { supabase } from './supabase'
import type {
  Prayer,
  PrayerInput,
  PrayerStatus,
  PrayerWithRelations,
} from '@/types/database'
import { TABLE } from './constants'

/** Kirim doa baru. */
export async function createPrayer(
  senderId: string,
  payload: PrayerInput
): Promise<Prayer> {
  const { data, error } = await supabase
    .from(TABLE.prayers)
    .insert({ ...payload, sender_id: senderId })
    .select()
    .single()
  if (error) throw error
  return data as Prayer
}

/**
 * Update status doa via RPC function `update_prayer_status`.
 * Aturan di-enforce di database:
 *   - pending → accepted : hanya receiver (pendoa)
 *   - * → prayed         : hanya receiver (pendoa)
 *   - prayed → completed : hanya sender (penitip)
 *   - accepted → pending : hanya sender (penitip) — batal
 */
export async function updatePrayerStatus(
  id: string,
  status: PrayerStatus
): Promise<Prayer> {
  const { data, error } = await supabase
    .rpc('update_prayer_status', {
      p_prayer_id: id,
      p_new_status: status,
    })
    .single()

  if (error) {
    // Tangani pesan error dari RPC (raise exception di PostgreSQL)
    const err = new Error(humanizePrayerError(error.message)) as Error & { original?: unknown }
    err.original = error
    throw err
  }
  return data as Prayer
}

/** Terjemahkan pesan error RPC ke Bahasa Indonesia yang user-friendly. */
function humanizePrayerError(msg: string): string {
  if (msg.includes('HANYA pendoa')) return msg // sudah Bahasa Indonesia
  if (msg.includes('HANYA penitip')) return msg
  if (msg.includes('tidak memiliki akses')) return msg
  if (msg.includes('tidak ditemukan')) return 'Doa tidak ditemukan.'
  if (msg.includes('harus login')) return 'Anda harus login untuk melakukan aksi ini.'
  // Default: kembalikan pesan apa adanya
  return msg
}

/** Hapus doa (hanya sender). */
export async function deletePrayer(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE.prayers).delete().eq('id', id)
  if (error) throw error
}

/** Daftar doa yang saya kirim (sebagai penitip). */
export async function fetchSentPrayers(userId: string): Promise<PrayerWithRelations[]> {
  const { data, error } = await supabase
    .from(TABLE.prayers)
    .select(`
      *,
      sender:profiles!prayers_sender_id_fkey ( id, full_name, avatar_url, city ),
      receiver:profiles!prayers_receiver_id_fkey ( id, full_name, avatar_url, city ),
      pilgrimage:pilgrimages ( id, type, departure_date, return_date )
    `)
    .eq('sender_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PrayerWithRelations[]
}

/** Daftar doa yang masuk ke saya (sebagai pendoa). */
export async function fetchReceivedPrayers(
  userId: string
): Promise<PrayerWithRelations[]> {
  const { data, error } = await supabase
    .from(TABLE.prayers)
    .select(`
      *,
      sender:profiles!prayers_sender_id_fkey ( id, full_name, avatar_url, city ),
      receiver:profiles!prayers_receiver_id_fkey ( id, full_name, avatar_url, city ),
      pilgrimage:pilgrimages ( id, type, departure_date, return_date )
    `)
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PrayerWithRelations[]
}

export async function fetchPrayerById(id: string): Promise<PrayerWithRelations | null> {
  const { data, error } = await supabase
    .from(TABLE.prayers)
    .select(`
      *,
      sender:profiles!prayers_sender_id_fkey ( id, full_name, avatar_url, city ),
      receiver:profiles!prayers_receiver_id_fkey ( id, full_name, avatar_url, city ),
      pilgrimage:pilgrimages ( id, type, departure_date, return_date )
    `)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as unknown as PrayerWithRelations | null
}
