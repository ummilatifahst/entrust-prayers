<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { fetchAdminStats, type AdminStats } from '@/services/admin.service'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const stats = ref<AdminStats | null>(null)

const prayerStatusBreakdown = computed(() => {
  if (!stats.value) return []
  const p = stats.value.prayers
  const total = p.total || 1
  return [
    { label: 'Menunggu', value: p.pending, percent: (p.pending / total) * 100, tone: 'gold' as const },
    { label: 'Diterima', value: p.accepted, percent: (p.accepted / total) * 100, tone: 'blue' as const },
    { label: 'Sudah Didoakan', value: p.prayed, percent: (p.prayed / total) * 100, tone: 'emerald' as const },
    { label: 'Selesai', value: p.completed, percent: (p.completed / total) * 100, tone: 'gray' as const },
  ]
})

async function load() {
  loading.value = true
  try {
    stats.value = await fetchAdminStats()
  } catch (e) {
    ui.error('Gagal memuat statistik')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div>
    <header class="mb-6">
      <p class="text-sm text-emerald-600">Panel Administrator</p>
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900 flex items-center gap-2">
        <Icon name="shield" :size="28" />
        Dashboard Admin
      </h1>
      <p class="text-sm text-emerald-600 mt-1">
        Pantau seluruh aktivitas aplikasi dari satu tempat
      </p>
    </header>

    <AppCard v-if="loading" padding><Spinner size="lg" /></AppCard>

    <template v-else-if="stats">
      <!-- Stat cards utama -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <AppCard padding>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-emerald-600">Total User</p>
              <p class="text-2xl font-bold text-emerald-900 mt-1">{{ stats.users.total }}</p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="users" :size="20" />
            </div>
          </div>
        </AppCard>
        <AppCard padding>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-emerald-600">Pendoa</p>
              <p class="text-2xl font-bold text-emerald-700 mt-1">{{ stats.users.pendoa }}</p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="kaaba" :size="20" />
            </div>
          </div>
        </AppCard>
        <AppCard padding>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-emerald-600">Penitip Doa</p>
              <p class="text-2xl font-bold text-gold-700 mt-1">{{ stats.users.penitip }}</p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center">
              <Icon name="send" :size="20" />
            </div>
          </div>
        </AppCard>
        <AppCard padding>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-emerald-600">Admin</p>
              <p class="text-2xl font-bold text-emerald-900 mt-1">{{ stats.users.admin }}</p>
            </div>
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="shield" :size="20" />
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Quick links -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <AppCard hover padding class="cursor-pointer" @click="router.push({ name: 'admin-users' })">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="users" :size="20" />
            </div>
            <div>
              <p class="font-semibold text-emerald-900">Kelola User</p>
              <p class="text-xs text-emerald-600">Ubah role & status</p>
            </div>
          </div>
        </AppCard>
        <AppCard hover padding class="cursor-pointer" @click="router.push({ name: 'admin-pilgrimages' })">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="map" :size="20" />
            </div>
            <div>
              <p class="font-semibold text-emerald-900">Kelola Perjalanan</p>
              <p class="text-xs text-emerald-600">Semua perjalanan ibadah</p>
            </div>
          </div>
        </AppCard>
        <AppCard hover padding class="cursor-pointer" @click="router.push({ name: 'admin-prayers' })">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="message" :size="20" />
            </div>
            <div>
              <p class="font-semibold text-emerald-900">Kelola Doa</p>
              <p class="text-xs text-emerald-600">Semua titipan doa</p>
            </div>
          </div>
        </AppCard>
        <AppCard hover padding class="cursor-pointer" @click="router.push({ name: 'admin-notifications' })">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon name="bell" :size="20" />
            </div>
            <div>
              <p class="font-semibold text-emerald-900">Broadcast</p>
              <p class="text-xs text-emerald-600">Kirim pengumuman</p>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Detail stats -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Prayer breakdown -->
        <AppCard padding>
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-bold text-emerald-900">Status Doa</h2>
            <AppBadge tone="emerald">Total: {{ stats.prayers.total }}</AppBadge>
          </div>
          <div class="space-y-3">
            <div v-for="row in prayerStatusBreakdown" :key="row.label">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-emerald-700">{{ row.label }}</span>
                <span class="font-semibold text-emerald-900">{{ row.value }}</span>
              </div>
              <div class="h-2 rounded-full bg-emerald-100 overflow-hidden">
                <div
                  :class="[
                    'h-full rounded-full transition-all',
                    row.tone === 'emerald' ? 'bg-emerald-500'
                    : row.tone === 'gold' ? 'bg-gold-400'
                    : row.tone === 'blue' ? 'bg-blue-400'
                    : 'bg-emerald-300',
                  ]"
                  :style="{ width: `${row.percent}%` }"
                />
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Pilgrimages & notifications -->
        <AppCard padding>
          <h2 class="font-display font-bold text-emerald-900 mb-4">Aktivitas Lainnya</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60">
              <span class="text-sm text-emerald-700">Total Perjalanan</span>
              <span class="font-bold text-emerald-900">{{ stats.pilgrimages.total }}</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60">
              <span class="text-sm text-emerald-700 flex items-center gap-2">
                Perjalanan Aktif
                <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <span class="font-bold text-emerald-700">{{ stats.pilgrimages.active }}</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60">
              <span class="text-sm text-emerald-700">Total Notifikasi Terkirim</span>
              <span class="font-bold text-emerald-900">{{ stats.notifications.total }}</span>
            </div>
          </div>
        </AppCard>
      </div>
    </template>

    <!-- Help for first-time admin -->
    <AppCard v-else padding>
      <p class="text-center text-emerald-700">Tidak ada data statistik tersedia.</p>
    </AppCard>
  </div>
</template>
