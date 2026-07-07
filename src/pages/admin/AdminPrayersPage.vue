<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { fetchAllPrayers, adminDeletePrayer, type AdminPrayerRow } from '@/services/admin.service'
import { updatePrayerStatus } from '@/services/prayer.service'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import PrayerStatusBadge from '@/components/cards/PrayerStatusBadge.vue'
import type { PrayerStatus } from '@/types/database'
import { formatDateTime } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const items = ref<AdminPrayerRow[]>([])
const search = ref('')
const filterStatus = ref<PrayerStatus | 'all'>('all')
const toDelete = ref<AdminPrayerRow | null>(null)
const showDelete = ref(false)
const detail = ref<AdminPrayerRow | null>(null)
const showDetail = ref(false)

const filtered = computed(() => {
  let list = items.value
  if (filterStatus.value !== 'all') list = list.filter((p) => p.status === filterStatus.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.sender?.full_name ?? '').toLowerCase().includes(q) ||
      (p.receiver?.full_name ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

async function load() {
  loading.value = true
  try {
    items.value = await fetchAllPrayers()
  } catch (e) {
    ui.error('Gagal memuat data doa')
  } finally {
    loading.value = false
  }
}

async function changeStatus(p: AdminPrayerRow, status: PrayerStatus) {
  try {
    await updatePrayerStatus(p.id, status)
    p.status = status
    ui.success(`Status diubah: ${status}`)
  } catch (e) {
    ui.error((e as Error).message)
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await adminDeletePrayer(toDelete.value.id)
    items.value = items.value.filter((p) => p.id !== toDelete.value!.id)
    ui.success('Doa dihapus.')
    showDelete.value = false
    toDelete.value = null
  } catch (e) {
    ui.error('Gagal menghapus')
  }
}

function openDetail(p: AdminPrayerRow) {
  detail.value = p
  showDetail.value = true
}

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div>
    <header class="mb-5">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900 flex items-center gap-2">
        <Icon name="message" :size="28" />
        Kelola Doa
      </h1>
      <p class="text-sm text-emerald-600 mt-1">Pantau dan kelola semua titipan doa di sistem</p>
    </header>

    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="flex-1">
        <AppInput v-model="search" placeholder="Cari judul, isi, atau nama...">
          <template #prefix><Icon name="message" :size="16" /></template>
        </AppInput>
      </div>
      <select v-model="filterStatus" class="form-input sm:w-44">
        <option value="all">Semua Status</option>
        <option value="pending">Menunggu</option>
        <option value="accepted">Diterima</option>
        <option value="prayed">Sudah Didoakan</option>
        <option value="completed">Selesai</option>
      </select>
    </div>

    <AppCard v-if="loading" padding><Spinner size="lg" /></AppCard>

    <AppCard v-else-if="filtered.length === 0" padding>
      <EmptyState icon="🤲" title="Belum ada doa" />
    </AppCard>

    <div v-else class="space-y-3">
      <AppCard v-for="p in filtered" :key="p.id" padding hover>
        <div class="flex items-start justify-between gap-3 mb-2">
          <button class="text-left flex-1 min-w-0" @click="openDetail(p)">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <PrayerStatusBadge :status="p.status" />
              <AppBadge v-if="p.is_private" tone="gray"><Icon name="lock" :size="10" class="mr-1" /> Privat</AppBadge>
              <AppBadge v-if="p.is_anonymous" tone="gray">Anonim</AppBadge>
            </div>
            <h3 class="font-semibold text-emerald-900">{{ p.title }}</h3>
            <p class="text-sm text-emerald-700 mt-1 line-clamp-2">{{ p.content }}</p>
          </button>
          <span class="text-xs text-emerald-500 flex-shrink-0">{{ formatDateTime(p.created_at) }}</span>
        </div>

        <div class="text-xs text-emerald-600 flex flex-wrap items-center gap-3 mt-2">
          <span class="flex items-center gap-1">
            <Icon name="user" :size="12" />
            Dari: <strong class="text-emerald-800">{{ p.is_anonymous ? 'Anonim' : (p.sender?.full_name ?? '—') }}</strong>
          </span>
          <span class="flex items-center gap-1">
            <Icon name="kaaba" :size="12" />
            Ke: <strong class="text-emerald-800">{{ p.receiver?.full_name ?? '—' }}</strong>
          </span>
        </div>

        <div class="mt-3 pt-3 border-t border-emerald-50 flex flex-wrap justify-end gap-2">
          <!-- Admin can force any status transition -->
          <select
            :value="p.status"
            class="text-xs rounded-lg border-emerald-200 px-2 py-1.5"
            @change="changeStatus(p, ($event.target as HTMLSelectElement).value as PrayerStatus)"
          >
            <option value="pending">Menunggu</option>
            <option value="accepted">Diterima</option>
            <option value="prayed">Sudah Didoakan</option>
            <option value="completed">Selesai</option>
          </select>
          <AppButton variant="secondary" size="sm" @click="openDetail(p)">
            <Icon name="eye" :size="14" />
            Detail
          </AppButton>
          <AppButton variant="danger" size="sm" @click="toDelete = p; showDelete = true">
            <Icon name="trash" :size="14" />
          </AppButton>
        </div>
      </AppCard>
    </div>

    <!-- Detail modal -->
    <AppModal v-model="showDetail" :title="detail?.title" size="lg">
      <div v-if="detail" class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <PrayerStatusBadge :status="detail.status" />
          <AppBadge v-if="detail.is_private" tone="gray"><Icon name="lock" :size="10" class="mr-1" /> Privat</AppBadge>
          <AppBadge v-if="detail.is_anonymous" tone="gray">Anonim</AppBadge>
          <span class="text-xs text-emerald-500 ml-auto">{{ formatDateTime(detail.created_at) }}</span>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="bg-emerald-50/60 rounded-xl p-3">
            <p class="text-xs text-emerald-600">Dari (Sender)</p>
            <p class="font-semibold text-emerald-900">{{ detail.is_anonymous ? 'Anonim' : (detail.sender?.full_name ?? '—') }}</p>
            <p class="text-xs text-emerald-600">{{ detail.sender?.email }}</p>
          </div>
          <div class="bg-emerald-50/60 rounded-xl p-3">
            <p class="text-xs text-emerald-600">Ke (Receiver)</p>
            <p class="font-semibold text-emerald-900">{{ detail.receiver?.full_name ?? '—' }}</p>
            <p class="text-xs text-emerald-600">{{ detail.receiver?.email }}</p>
          </div>
        </div>

        <div class="bg-emerald-50/40 rounded-xl p-4">
          <p class="text-xs text-emerald-600 mb-1">Isi Doa</p>
          <p class="text-sm text-emerald-900 whitespace-pre-wrap">{{ detail.content }}</p>
        </div>

        <div v-if="detail.prayed_at || detail.completed_at" class="grid grid-cols-2 gap-3 text-xs text-emerald-700">
          <div v-if="detail.prayed_at" class="flex items-center gap-2">
            <Icon name="check-circle" :size="14" />
            Didoakan: {{ formatDateTime(detail.prayed_at) }}
          </div>
          <div v-if="detail.completed_at" class="flex items-center gap-2">
            <Icon name="check-circle" :size="14" />
            Selesai: {{ formatDateTime(detail.completed_at) }}
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Delete modal -->
    <AppModal v-model="showDelete" title="Hapus Doa" size="sm">
      <p class="text-sm text-emerald-700">Hapus doa ini secara permanen?</p>
      <p v-if="toDelete" class="mt-3 p-3 bg-red-50 rounded-lg text-sm">
        <strong>{{ toDelete.title }}</strong>
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="showDelete = false">Batal</AppButton>
        <AppButton variant="danger" @click="confirmDelete">Hapus</AppButton>
      </template>
    </AppModal>
  </div>
</template>
