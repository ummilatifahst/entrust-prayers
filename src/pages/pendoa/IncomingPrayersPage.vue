<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { fetchReceivedPrayers, updatePrayerStatus } from '@/services/prayer.service'
import type { PrayerWithRelations, PrayerStatus } from '@/types/database'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import PrayerStatusBadge from '@/components/cards/PrayerStatusBadge.vue'
import { formatDateTime } from '@/utils/format'
import { usePrayerRealtime } from '@/composables/usePrayerRealtime'

const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const prayers = ref<PrayerWithRelations[]>([])
const filter = ref<PrayerStatus | 'all'>('all')

const filtered = computed(() => {
  if (filter.value === 'all') return prayers.value
  return prayers.value.filter((p) => p.status === filter.value)
})

async function load() {
  if (!auth.user) return
  loading.value = true
  try {
    prayers.value = await fetchReceivedPrayers(auth.user.id)
    setupRealtime()
  } finally {
    loading.value = false
  }
}

let realtimeBound = false
function setupRealtime() {
  if (realtimeBound || !auth.user) return
  realtimeBound = true
  usePrayerRealtime(auth.user.id, 'receiver', {
    onInsert: (prayer) => {
      // Reload agar dapat relasi sender/pilgrimage yang lengkap
      load()
      ui.info(`Titipan doa baru: "${prayer.title}"`)
    },
    onUpdate: (updated) => {
      const idx = prayers.value.findIndex((p) => p.id === updated.id)
      if (idx !== -1) {
        prayers.value[idx] = { ...prayers.value[idx]!, ...updated }
      }
    },
  })
}

async function changeStatus(p: PrayerWithRelations, status: PrayerStatus) {
  const prev = p.status
  // Optimistic update
  p.status = status
  try {
    await updatePrayerStatus(p.id, status)
    const labels: Record<PrayerStatus, string> = {
      pending: 'doa dikembalikan ke Menunggu',
      accepted: 'doa diterima',
      prayed: 'doa ditandai sudah didoakan',
      completed: 'doa diselesaikan',
    }
    ui.success(`Berhasil: ${labels[status]}.`)
  } catch (e) {
    p.status = prev
    ui.error('Gagal memperbarui status')
  }
}

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div>
    <header class="mb-5">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">Titipan Doa Masuk</h1>
      <p class="text-sm text-emerald-600">Kelola dan tandai doa yang sudah Anda amanahkan</p>
      <div class="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-700 flex items-start gap-2">
        <Icon name="info" :size="14" class="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Sebagai pendoa</strong>, Anda hanya bisa <em>menerima</em> dan <em>menandai sudah didoakan</em>.
          Penitip yang akan menyelesaikan doa setelah didoakan.
        </span>
      </div>
    </header>

    <div class="inline-flex rounded-xl bg-white border border-emerald-200 p-1 mb-4 overflow-x-auto max-w-full">
      <button
        v-for="opt in [
          { v: 'all', l: 'Semua' },
          { v: 'pending', l: 'Menunggu' },
          { v: 'accepted', l: 'Diterima' },
          { v: 'prayed', l: 'Didoakan' },
          { v: 'completed', l: 'Selesai' },
        ]"
        :key="opt.v"
        :class="[
          'px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition',
          filter === opt.v ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50',
        ]"
        @click="filter = opt.v as PrayerStatus | 'all'"
      >
        {{ opt.l }}
      </button>
    </div>

    <AppCard v-if="loading" padding><Spinner size="lg" /></AppCard>

    <AppCard v-else-if="filtered.length === 0" padding>
      <EmptyState
        icon="🤲"
        title="Belum ada titipan masuk"
        description="Aktifkan perjalanan Anda agar penitip dapat menitipkan doa."
      />
    </AppCard>

    <div v-else class="space-y-3">
      <AppCard v-for="p in filtered" :key="p.id" padding hover>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <PrayerStatusBadge :status="p.status" />
            <AppBadge v-if="p.is_private" tone="gray">
              <Icon name="lock" :size="10" class="mr-1" /> Privat
            </AppBadge>
          </div>
          <span class="text-xs text-emerald-500 flex-shrink-0">{{ formatDateTime(p.created_at) }}</span>
        </div>

        <h3 class="font-semibold text-emerald-900">{{ p.title }}</h3>
        <p class="text-sm text-emerald-700 mt-1 leading-relaxed whitespace-pre-wrap">{{ p.content }}</p>

        <div class="text-xs text-emerald-600 mt-3 flex items-center gap-2">
          <Icon name="user" :size="12" />
          Dari: <strong class="text-emerald-800">
            {{ p.is_anonymous ? 'Anonim' : (p.sender?.full_name ?? 'Penitip') }}
          </strong>
          <span v-if="p.sender?.city && !p.is_anonymous">· {{ p.sender.city }}</span>
        </div>

        <!-- Action buttons — sesuai otoritas pendoa (hanya accept & pray) -->
        <div class="mt-3 pt-3 border-t border-emerald-50 flex flex-wrap justify-end gap-2">
          <template v-if="p.status === 'pending'">
            <AppButton variant="primary" size="sm" @click="changeStatus(p, 'accepted')">
              <Icon name="check-circle" :size="14" />
              Terima
            </AppButton>
          </template>
          <template v-if="p.status === 'accepted' || p.status === 'pending'">
            <AppButton variant="gold" size="sm" @click="changeStatus(p, 'prayed')">
              <Icon name="check-circle" :size="14" />
              Sudah Didoakan
            </AppButton>
          </template>
          <p v-if="p.status === 'prayed'" class="text-xs text-emerald-600 italic self-center mr-auto">
            Menunggu penitip menandai selesai...
          </p>
          <p v-if="p.status === 'completed'" class="text-xs text-emerald-600 italic self-center mr-auto">
            Doa sudah diselesaikan penitip.
          </p>
        </div>

        <p v-if="p.prayed_at" class="text-xs text-emerald-700 font-medium mt-2 flex items-center gap-1">
          <Icon name="check-circle" :size="12" />
          Didoakan pada: {{ formatDateTime(p.prayed_at) }}
        </p>
      </AppCard>
    </div>
  </div>
</template>
