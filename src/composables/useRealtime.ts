import { onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'

/**
 * Composable untuk subscribe ke tabel Supabase Realtime.
 * Otomatis unsubscribe saat komponen unmount.
 */
export function useRealtime() {
  const channels: ReturnType<typeof supabase.channel>[] = []

  function subscribe<T = unknown>(
    topic: string,
    table: string,
    filter: string | undefined,
    onPayload: (payload: T) => void
  ) {
    let ch = supabase.channel(topic)
    if (filter) {
      ch = ch.on('postgres_changes',
        { event: '*', schema: 'public', table, filter },
        (payload) => onPayload(payload as unknown as T)
      )
    } else {
      ch = ch.on('postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => onPayload(payload as unknown as T)
      )
    }
    ch.subscribe()
    channels.push(ch)
    return ch
  }

  onUnmounted(() => {
    channels.forEach((c) => supabase.removeChannel(c))
  })

  return { subscribe }
}
