<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { fetchSentPrayers } from '@/services/prayer.service'
import { fetchActivePilgrimages } from '@/services/pilgrimage.service'
import type { PrayerWithRelations, PilgrimageWithPendoa } from '@/types/database'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Icon from '@/components/ui/Icon.vue'
import Spinner from '@/components/ui/Spinner.vue'
import PrayerStatusBadge from '@/components/cards/PrayerStatusBadge.vue'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const sentPrayers = ref<PrayerWithRelations[]>([])
const activePendoa = ref<PilgrimageWithPendoa[]>([])

const stats = computed(() => ({
  total: sentPrayers.value.length,
  pending: sentPrayers.value.filter((p) => p.status === 'pending').length,
  prayed: sentPrayers.value.filter((p) => p.status === 'prayed' || p.status === 'completed').length,
}))

async function load() {
  if (!auth.user) return
  loading.value = true
  try {
    const [list, pendoa] = await Promise.all([
      fetchSentPrayers(auth.user.id),
      fetchActivePilgrimages(),
    ])
    sentPrayers.value = list
    activePendoa.value = pendoa.slice(0, 3)
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
      <p class="text-sm text-emerald-600">Assalamu'alaikum,</p>
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">
        {{ auth.displayName }} 🤲
      </h1>
    </header>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <AppCard padding>
        <p class="text-xs text-emerald-600">Total Titipan</p>
        <p class="text-2xl font-bold text-emerald-900 mt-1">{{ stats.total }}</p>
      </AppCard>
      <AppCard padding>
        <p class="text-xs text-emerald-600">Menunggu</p>
        <p class="text-2xl font-bold text-gold-700 mt-1">{{ stats.pending }}</p>
      </AppCard>
      <AppCard padding>
        <p class="text-xs text-emerald-600">Sudah Didoakan</p>
        <p class="text-2xl font-bold text-emerald-700 mt-1">{{ stats.prayed }}</p>
      </AppCard>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Recent prayers -->
      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-emerald-900">Titipan Terbaru</h2>
          <AppButton variant="ghost" size="sm" @click="router.push({ name: 'penitip-prayers' })">
            Lihat semua
            <Icon name="chevron-right" :size="14" />
          </AppButton>
        </div>

        <div v-if="loading" class="card"><Spinner /></div>
        <AppCard v-else-if="sentPrayers.length === 0" padding>
          <EmptyState
            icon="🤲"
            title="Belum ada titipan doa"
            description="Mulai kirim doa pertama Anda kepada pendoa pilihan."
          >
            <template #action>
              <AppButton variant="primary" @click="router.push({ name: 'penitip-pendoa-list' })">
                <Icon name="users" :size="16" />
                Cari Pendoa
              </AppButton>
            </template>
          </EmptyState>
        </AppCard>

        <div v-else class="space-y-2">
          <div
            v-for="p in sentPrayers.slice(0, 5)"
            :key="p.id"
            class="card !p-4 hover:bg-emerald-50/40 transition cursor-pointer"
            @click="router.push({ name: 'penitip-prayers' })"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-emerald-900 truncate">{{ p.title }}</p>
                <p class="text-xs text-emerald-600 mt-0.5">
                  Untuk: {{ p.receiver?.full_name ?? 'Pendoa' }}
                </p>
              </div>
              <PrayerStatusBadge :status="p.status" />
            </div>
          </div>
        </div>
      </div>

      <!-- Active pendoa -->
      <aside>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-emerald-900">Pendoa Aktif</h2>
        </div>
        <div v-if="loading" class="card"><Spinner /></div>
        <div v-else-if="activePendoa.length === 0" class="card">
          <EmptyState icon="🕋" title="Belum ada pendoa aktif" />
        </div>
        <div v-else class="space-y-2">
          <AppCard
            v-for="p in activePendoa"
            :key="p.id"
            hover
            padding
            class="!p-4 cursor-pointer"
            @click="router.push({ name: 'penitip-pendoa-detail', params: { id: p.id } })"
          >
            <p class="font-semibold text-emerald-900 text-sm">{{ p.pendoa?.full_name }}</p>
            <p class="text-xs text-emerald-600 mt-0.5">
              <Icon name="map" :size="12" class="inline" /> {{ p.pendoa?.city ?? '-' }} · {{ p.type === 'haji' ? 'Haji' : 'Umroh' }}
            </p>
          </AppCard>
        </div>
        <AppButton variant="secondary" block class="mt-3" @click="router.push({ name: 'penitip-pendoa-list' })">
          Lihat semua pendoa
        </AppButton>
      </aside>
    </div>
  </div>
</template>
