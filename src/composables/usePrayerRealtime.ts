import { onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import type { PrayerWithRelations } from '@/types/database'

/**
 * Subscribe ke perubahan pada tabel prayers untuk user tertentu.
 * - Saat INSERT baru → callback onInsert
 * - Saat UPDATE status → callback onUpdate
 *
 * @param userId User ID pengguna yang sedang login
 * @param as 'sender' | 'receiver' — sisi mana yang subscribe
 */
export function usePrayerRealtime(
  userId: string,
  as: 'sender' | 'receiver',
  callbacks: {
    onInsert?: (prayer: PrayerWithRelations) => void
    onUpdate?: (prayer: Partial<PrayerWithRelations> & { id: string }) => void
    onDelete?: (id: string) => void
  }
) {
  const column = as === 'sender' ? 'sender_id' : 'receiver_id'

  const channel = supabase
    .channel(`prayers:${as}:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'prayers', filter: `${column}=eq.${userId}` },
      (payload) => {
        if (callbacks.onInsert) {
          callbacks.onInsert(payload.new as PrayerWithRelations)
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'prayers', filter: `${column}=eq.${userId}` },
      (payload) => {
        if (callbacks.onUpdate) {
          callbacks.onUpdate(payload.new as Partial<PrayerWithRelations> & { id: string })
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'prayers', filter: `${column}=eq.${userId}` },
      (payload) => {
        if (callbacks.onDelete && payload.old?.id) {
          callbacks.onDelete(payload.old.id as string)
        }
      }
    )
    .subscribe()

  onUnmounted(() => {
    supabase.removeChannel(channel)
  })

  return { channel }
}
