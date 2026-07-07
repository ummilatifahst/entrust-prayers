<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useUiStore } from '@/stores/ui.store'
import type { AppNotification } from '@/types/database'

const auth = useAuthStore()
const notifications = useNotificationStore()
const ui = useUiStore()

let channel: ReturnType<typeof supabase.channel> | null = null

async function setup() {
  await auth.init()
  if (!auth.user) return

  channel = supabase
    .channel(`notifications:${auth.user.id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${auth.user.id}`,
      },
      (payload) => {
        const n = payload.new as AppNotification
        notifications.upsert(n)
        ui.info(`${n.title}: ${n.message}`)
      }
    )
    .subscribe()
}

onMounted(() => {
  setup()
})

onUnmounted(() => {
  if (channel) supabase.removeChannel(channel)
})
</script>

<template>
  <!-- Komponen ini tidak render UI, hanya listen realtime -->
</template>
