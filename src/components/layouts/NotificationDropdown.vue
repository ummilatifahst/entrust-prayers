<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification.store'
import Icon from '@/components/ui/Icon.vue'
import { timeAgo } from '@/utils/format'

const notifications = useNotificationStore()
const router = useRouter()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
  if (open.value && notifications.unreadCount > 0) {
    setTimeout(() => notifications.markAllRead(), 1500)
  }
}

function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})

function viewAll() {
  open.value = false
  router.push({ name: 'notifications' })
}

function iconFor(type: string) {
  switch (type) {
    case 'new_prayer':       return 'message'
    case 'prayer_accepted':  return 'heart'
    case 'prayer_prayed':    return 'check-circle'
    case 'prayer_completed': return 'check-circle'
    default:                 return 'info'
  }
}
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="relative p-2 rounded-xl hover:bg-emerald-100 text-emerald-700"
      @click="toggle"
      aria-label="Notifikasi"
    >
      <Icon name="bell" :size="20" />
      <span
        v-if="notifications.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center"
      >
        {{ notifications.unreadCount > 9 ? '9+' : notifications.unreadCount }}
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden z-40"
      >
        <div class="px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
          <h3 class="font-semibold text-emerald-900">Notifikasi</h3>
          <span v-if="notifications.hasUnread" class="text-xs text-emerald-600">{{ notifications.unreadCount }} baru</span>
        </div>

        <div class="max-h-96 overflow-y-auto scrollbar-thin">
          <div v-if="notifications.items.length === 0" class="px-4 py-8 text-center">
            <Icon name="bell" :size="32" class="mx-auto text-emerald-300 mb-2" />
            <p class="text-sm text-emerald-600">Belum ada notifikasi</p>
          </div>

          <ul v-else class="divide-y divide-emerald-50">
            <li
              v-for="n in notifications.items.slice(0, 10)"
              :key="n.id"
              :class="[
                'px-4 py-3 hover:bg-emerald-50 transition cursor-pointer',
                !n.is_read ? 'bg-emerald-50/60' : '',
              ]"
              @click="viewAll"
            >
              <div class="flex gap-3">
                <div :class="[
                  'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  n.type === 'prayer_prayed' || n.type === 'prayer_completed'
                    ? 'bg-emerald-100 text-emerald-700'
                    : n.type === 'new_prayer'
                    ? 'bg-gold-100 text-gold-700'
                    : 'bg-blue-100 text-blue-700',
                ]">
                  <Icon :name="iconFor(n.type)" :size="16" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-emerald-900">{{ n.title }}</p>
                  <p class="text-xs text-emerald-600 line-clamp-2">{{ n.message }}</p>
                  <p class="text-xs text-emerald-400 mt-0.5">{{ timeAgo(n.created_at) }}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <button
          class="w-full px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 border-t border-emerald-100"
          @click="viewAll"
        >
          Lihat semua
        </button>
      </div>
    </Transition>
  </div>
</template>
