<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { fetchSentPrayers, updatePrayerStatus, deletePrayer } from '@/services/prayer.service'
import type { PrayerWithRelations, PrayerStatus } from '@/types/database'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import PrayerStatusBadge from '@/components/cards/PrayerStatusBadge.vue'
import { formatDateTime } from '@/utils/format'
import { usePrayerRealtime } from '@/composables/usePrayerRealtime'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const prayers = ref<PrayerWithRelations[]>([])
const filter = ref<PrayerStatus | 'all'>('all')
const selected = ref<PrayerWithRelations | null>(null)
const showDelete = ref(false)

const filtered = computed(() => {
  if (filter.value === 'all') return prayers.value
  return prayers.value.filter((p) => p.status === filter.value)
})

async function load() {
  if (!auth.user) return
  loading.value = true
  try {
    prayers.value = await fetchSentPrayers(auth.user.id)
    setupRealtime()
  } finally {
    loading.value = false
  }
}

let realtimeBound = false
function setupRealtime() {
  if (realtimeBound || !auth.user) return
  realtimeBound = true
  usePrayerRealtime(auth.user.id, 'sender', {
    onUpdate: (updated) => {
      const idx = prayers.value.findIndex((p) => p.id === updated.id)
      if (idx !== -1) {
        const prev = prayers.value[idx]!
        prayers.value[idx] = { ...prev, ...updated }
        // Toast saat status berubah
        if (prev.status !== updated.status) {
          if (updated.status === 'accepted') ui.info(`Doa "${prev.title}" telah diterima pendoa.`)
          else if (updated.status === 'prayed') ui.success(`Alhamdulillah, doa "${prev.title}" telah didoakan.`)
          else if (updated.status === 'completed') ui.info(`Doa "${prev.title}" ditandai selesai.`)
        }
      }
    },
    onDelete: (id) => {
      prayers.value = prayers.value.filter((p) => p.id !== id)
    },
  })
}

async function markComplete(p: PrayerWithRelations) {
  try {
    await updatePrayerStatus(p.id, 'completed')
    p.status = 'completed'
    ui.success('Doa ditandai selesai.')
  } catch (e) {
    ui.error('Gagal memperbarui status')
  }
}

async function confirmDelete() {
  if (!selected.value) return
  try {
    await deletePrayer(selected.value.id)
    prayers.value = prayers.value.filter((p) => p.id !== selected.value!.id)
    ui.success('Doa dihapus.')
    showDelete.value = false
    selected.value = null
  } catch (e) {
    ui.error('Gagal menghapus doa')
  }
}

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div>
    <header class="mb-5 flex items-center justify-between gap-3">
      <div class="flex-1">
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">Titipan Saya</h1>
        <p class="text-sm text-emerald-600">Pantau status semua doa yang Anda titipkan</p>
        <div class="mt-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-700 flex items-start gap-2">
          <Icon name="info" :size="14" class="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Sebagai penitip</strong>, Anda tidak bisa menandai doa sebagai "sudah didoakan" — itu hak pendoa.
            Anda dapat membatalkan doa (sebelum diterima) atau menyelesaikannya setelah didoakan.
          </span>
        </div>
      </div>
      <AppButton variant="primary" size="sm" @click="router.push({ name: 'penitip-pendoa-list' })">
        <Icon name="plus" :size="16" />
        <span class="hidden sm:inline">Titip Doa Baru</span>
      </AppButton>
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

    <div v-if="loading" class="card"><Spinner /></div>

    <AppCard v-else-if="filtered.length === 0" padding>
      <EmptyState
        icon="🤲"
        title="Belum ada titipan doa"
        description="Mulai titipkan doa kepada pendoa pilihan Anda."
      >
        <template #action>
          <AppButton variant="primary" @click="router.push({ name: 'penitip-pendoa-list' })">
            <Icon name="users" :size="16" />
            Cari Pendoa
          </AppButton>
        </template>
      </EmptyState>
    </AppCard>

    <div v-else class="space-y-3">
      <AppCard
        v-for="p in filtered"
        :key="p.id"
        padding
        hover
        class="!p-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <PrayerStatusBadge :status="p.status" />
              <AppBadge v-if="p.is_private" tone="gray">
                <Icon name="lock" :size="10" class="mr-1" />
                Privat
              </AppBadge>
              <AppBadge v-if="p.is_anonymous" tone="gray">Anonim</AppBadge>
            </div>
            <h3 class="font-semibold text-emerald-900">{{ p.title }}</h3>
            <p class="text-sm text-emerald-700 mt-1 line-clamp-2">{{ p.content }}</p>
            <div class="text-xs text-emerald-600 mt-2 flex flex-wrap gap-x-3 gap-y-1">
              <span class="flex items-center gap-1">
                <Icon name="user" :size="12" />
                Kepada: <strong class="text-emerald-800">{{ p.receiver?.full_name ?? 'Pendoa' }}</strong>
              </span>
              <span class="flex items-center gap-1">
                <Icon name="calendar" :size="12" />
                {{ formatDateTime(p.created_at) }}
              </span>
              <span v-if="p.prayed_at" class="flex items-center gap-1 text-emerald-700 font-medium">
                <Icon name="check-circle" :size="12" />
                Didoakan: {{ formatDateTime(p.prayed_at) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="p.status === 'prayed'" class="mt-3 pt-3 border-t border-emerald-50 flex justify-end gap-2">
          <AppButton variant="secondary" size="sm" @click="markComplete(p)">
            <Icon name="check-circle" :size="14" />
            Tandai Selesai
          </AppButton>
        </div>
        <div v-else-if="p.status === 'pending'" class="mt-3 pt-3 border-t border-emerald-50 flex justify-end">
          <AppButton
            variant="danger"
            size="sm"
            @click="selected = p; showDelete = true"
          >
            <Icon name="trash" :size="14" />
            Batalkan
          </AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Delete modal -->
    <AppModal v-model="showDelete" title="Batalkan Doa" size="sm">
      <p class="text-sm text-emerald-700">
        Yakin ingin membatalkan titipan doa ini? Tindakan ini tidak dapat dibatalkan.
      </p>
      <p v-if="selected" class="mt-3 p-3 bg-emerald-50/60 rounded-lg text-sm">
        <strong>{{ selected.title }}</strong>
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="showDelete = false">Batal</AppButton>
        <AppButton variant="danger" @click="confirmDelete">
          <Icon name="trash" :size="14" />
          Ya, Batalkan
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
