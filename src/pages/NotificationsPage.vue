<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification.store'
import { useAuthStore } from '@/stores/auth.store'
import Icon from '@/components/ui/Icon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { timeAgo } from '@/utils/format'

const notifications = useNotificationStore()
const auth = useAuthStore()

onMounted(async () => {
  await auth.init()
  if (auth.user) await notifications.load()
})

function iconFor(type: string) {
  switch (type) {
    case 'new_prayer':       return 'message'
    case 'prayer_accepted':  return 'heart'
    case 'prayer_prayed':    return 'check-circle'
    case 'prayer_completed': return 'check-circle'
    default:                 return 'info'
  }
}

function toneClass(type: string) {
  if (type === 'prayer_prayed' || type === 'prayer_completed') return 'bg-emerald-100 text-emerald-700'
  if (type === 'new_prayer') return 'bg-gold-100 text-gold-700'
  return 'bg-blue-100 text-blue-700'
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <header class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold text-emerald-900">Notifikasi</h1>
        <p class="text-sm text-emerald-600">Semua kabar terbaru untuk Anda</p>
      </div>
      <AppButton
        v-if="notifications.hasUnread"
        variant="secondary"
        size="sm"
        @click="notifications.markAllRead"
      >
        Tandai semua dibaca
      </AppButton>
    </header>

    <div v-if="notifications.items.length === 0" class="card">
      <EmptyState
        icon="🔔"
        title="Belum ada notifikasi"
        description="Kabar terbaru akan muncul di sini."
      />
    </div>

    <ul v-else class="space-y-2">
      <li
        v-for="n in notifications.items"
        :key="n.id"
        :class="[
          'card !p-4 flex items-start gap-3 transition cursor-pointer',
          !n.is_read ? '!bg-emerald-50/60 ring-1 ring-emerald-200' : '',
        ]"
        @click="!n.is_read && notifications.markRead(n.id)"
      >
        <div :class="['h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', toneClass(n.type)]">
          <Icon :name="iconFor(n.type)" :size="20" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-emerald-900">{{ n.title }}</p>
            <span v-if="!n.is_read" class="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
          </div>
          <p class="text-sm text-emerald-700 mt-0.5">{{ n.message }}</p>
          <p class="text-xs text-emerald-500 mt-1">{{ timeAgo(n.created_at) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>
