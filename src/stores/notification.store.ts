import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppNotification } from '@/types/database'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  countUnread,
} from '@/services/notification.service'
import { useAuthStore } from './auth.store'

export const useNotificationStore = defineStore('notification', () => {
  const items = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const subscribed = ref(false)

  const hasUnread = computed(() => unreadCount.value > 0)

  async function load() {
    const auth = useAuthStore()
    if (!auth.user) return
    loading.value = true
    try {
      const [list, count] = await Promise.all([
        fetchNotifications(auth.user.id),
        countUnread(auth.user.id),
      ])
      items.value = list
      unreadCount.value = count
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: string) {
    const auth = useAuthStore()
    if (!auth.user) return
    await markNotificationRead(id)
    const target = items.value.find((n) => n.id === id)
    if (target && !target.is_read) {
      target.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllRead() {
    const auth = useAuthStore()
    if (!auth.user) return
    await markAllNotificationsRead(auth.user.id)
    items.value.forEach((n) => (n.is_read = true))
    unreadCount.value = 0
  }

  function upsert(notification: AppNotification) {
    const idx = items.value.findIndex((n) => n.id === notification.id)
    if (idx === -1) {
      items.value.unshift(notification)
      if (!notification.is_read) unreadCount.value++
    } else {
      items.value[idx] = notification
    }
  }

  return {
    items, unreadCount, loading, subscribed, hasUnread,
    load, markRead, markAllRead, upsert,
  }
})
