<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Icon from '@/components/ui/Icon.vue'
import NotificationDropdown from './NotificationDropdown.vue'

defineEmits<{ (e: 'toggle-sidebar'): void }>()

const router = useRouter()
const auth = useAuthStore()

function goHome() {
  if (!auth.isAuthenticated) {
    router.push({ name: 'landing' })
    return
  }
  if (auth.isPenitip) router.push({ name: 'penitip-dashboard' })
  else if (auth.isPendoa) router.push({ name: 'pendoa-dashboard' })
  else router.push({ name: 'dashboard-default' })
}
</script>

<template>
  <header class="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-emerald-100">
    <div class="container-page h-full flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button
          class="lg:hidden text-emerald-700 hover:bg-emerald-100 rounded-lg p-2"
          @click="$emit('toggle-sidebar')"
          aria-label="Toggle menu"
        >
          <Icon name="menu" :size="22" />
        </button>

        <button class="flex items-center gap-2 group" @click="goHome">
          <div class="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Icon name="kaaba" :size="20" />
          </div>
          <div class="hidden sm:block text-left leading-tight">
            <p class="font-display font-bold text-emerald-900">Entrust Prayers</p>
            <p class="text-xs text-emerald-600">Titip doa ke Tanah Suci</p>
          </div>
        </button>
      </div>

      <div class="flex items-center gap-2">
        <NotificationDropdown />
        <button
          class="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-100"
          @click="router.push({ name: 'profile-edit' })"
        >
          <div class="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold overflow-hidden">
            <img v-if="auth.profile?.avatar_url" :src="auth.profile.avatar_url" :alt="auth.displayName" class="h-full w-full object-cover" />
            <span v-else>{{ auth.displayName.charAt(0).toUpperCase() }}</span>
          </div>
          <span class="text-sm font-medium text-emerald-800">{{ auth.displayName }}</span>
        </button>
      </div>
    </div>
  </header>
</template>
