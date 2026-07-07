<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Icon from '@/components/ui/Icon.vue'
import type { IconName } from '@/components/ui/icon-types'

interface NavItem {
  to: { name: string }
  label: string
  icon: IconName
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const items = computed<NavItem[]>(() => {
  if (auth.isAdmin) {
    return [
      { to: { name: 'admin-dashboard' },      label: 'Dashboard',         icon: 'home' },
      { to: { name: 'admin-users' },          label: 'Kelola User',       icon: 'users' },
      { to: { name: 'admin-pilgrimages' },    label: 'Kelola Perjalanan', icon: 'map' },
      { to: { name: 'admin-prayers' },        label: 'Kelola Doa',        icon: 'message' },
      { to: { name: 'admin-notifications' },  label: 'Broadcast',         icon: 'bell' },
      { to: { name: 'profile-edit' },         label: 'Profil',            icon: 'user' },
    ]
  }
  if (auth.isPenitip) {
    return [
      { to: { name: 'penitip-dashboard' },    label: 'Dashboard',    icon: 'home' },
      { to: { name: 'penitip-pendoa-list' },  label: 'Daftar Pendoa',icon: 'users' },
      { to: { name: 'penitip-prayers' },      label: 'Titipan Saya', icon: 'send' },
      { to: { name: 'profile-edit' },         label: 'Profil',       icon: 'user' },
    ]
  }
  if (auth.isPendoa) {
    return [
      { to: { name: 'pendoa-dashboard' },     label: 'Dashboard',        icon: 'home' },
      { to: { name: 'pendoa-pilgrimages' },   label: 'Perjalanan Saya',  icon: 'map' },
      { to: { name: 'pendoa-prayers' },       label: 'Titipan Masuk',    icon: 'message' },
      { to: { name: 'profile-edit' },         label: 'Profil',           icon: 'user' },
    ]
  }
  return [
    { to: { name: 'profile-edit' }, label: 'Profil', icon: 'user' },
  ]
})

function isActive(name: string) {
  return route.name === name || route.matched.some((r) => r.name === name)
}

async function logout() {
  await auth.logout()
  router.push({ name: 'landing' })
}
</script>

<template>
  <nav class="px-3 py-4 space-y-1">
    <router-link
      v-for="item in items"
      :key="item.to.name"
      :to="item.to"
      :class="[
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
        isActive(item.to.name)
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-emerald-700 hover:bg-emerald-100',
      ]"
    >
      <Icon :name="item.icon" :size="18" />
      <span>{{ item.label }}</span>
    </router-link>

    <button
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-4"
      @click="logout"
    >
      <Icon name="logout" :size="18" />
      <span>Keluar</span>
    </button>
  </nav>
</template>
