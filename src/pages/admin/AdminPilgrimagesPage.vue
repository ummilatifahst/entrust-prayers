<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import {
  fetchAllPilgrimages,
  adminDeletePilgrimage,
  adminUpdatePilgrimageStatus,
  type AdminPilgrimageRow,
} from '@/services/admin.service'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import type { PilgrimageStatus, PilgrimageType } from '@/types/database'
import {
  formatDate,
  PILGRIMAGE_STATUS_LABEL,
  PILGRIMAGE_TYPE_LABEL,
} from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const items = ref<AdminPilgrimageRow[]>([])
const search = ref('')
const filterStatus = ref<PilgrimageStatus | 'all'>('all')
const filterType = ref<PilgrimageType | 'all'>('all')
const toDelete = ref<AdminPilgrimageRow | null>(null)
const showDelete = ref(false)

const filtered = computed(() => {
  let list = items.value
  if (filterStatus.value !== 'all') list = list.filter((p) => p.status === filterStatus.value)
  if (filterType.value !== 'all') list = list.filter((p) => p.type === filterType.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) =>
      (p.pendoa?.full_name ?? '').toLowerCase().includes(q) ||
      (p.pendoa?.email ?? '').toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

async function load() {
  loading.value = true
  try {
    items.value = await fetchAllPilgrimages()
  } catch (e) {
    ui.error('Gagal memuat data perjalanan')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(p: AdminPilgrimageRow) {
  const newStatus: PilgrimageStatus = p.status === 'active' ? 'draft' : 'active'
  try {
    await adminUpdatePilgrimageStatus(p.id, newStatus)
    p.status = newStatus
    ui.success(`Status: ${PILGRIMAGE_STATUS_LABEL[newStatus]}`)
  } catch (e) {
    ui.error('Gagal mengubah status')
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await adminDeletePilgrimage(toDelete.value.id)
    items.value = items.value.filter((p) => p.id !== toDelete.value!.id)
    ui.success('Perjalanan dihapus.')
    showDelete.value = false
    toDelete.value = null
  } catch (e) {
    ui.error('Gagal menghapus')
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
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900 flex items-center gap-2">
        <Icon name="map" :size="28" />
        Kelola Perjalanan
      </h1>
      <p class="text-sm text-emerald-600 mt-1">Semua perjalanan ibadah di sistem</p>
    </header>

    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="flex-1">
        <AppInput v-model="search" placeholder="Cari pendoa atau deskripsi...">
          <template #prefix><Icon name="map" :size="16" /></template>
        </AppInput>
      </div>
      <select v-model="filterType" class="form-input sm:w-32">
        <option value="all">Semua Jenis</option>
        <option value="haji">Haji</option>
        <option value="umroh">Umroh</option>
      </select>
      <select v-model="filterStatus" class="form-input sm:w-36">
        <option value="all">Semua Status</option>
        <option value="draft">Draf</option>
        <option value="active">Aktif</option>
        <option value="finished">Selesai</option>
      </select>
    </div>

    <AppCard v-if="loading" padding><Spinner size="lg" /></AppCard>

    <AppCard v-else-if="filtered.length === 0" padding>
      <EmptyState icon="🗺️" title="Belum ada perjalanan" />
    </AppCard>

    <div v-else class="space-y-3">
      <AppCard v-for="p in filtered" :key="p.id" padding>
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <AppBadge :tone="p.type === 'haji' ? 'gold' : 'emerald'">
                {{ PILGRIMAGE_TYPE_LABEL[p.type] }}
              </AppBadge>
              <AppBadge :tone="p.status === 'active' ? 'emerald' : p.status === 'draft' ? 'gold' : 'gray'">
                {{ PILGRIMAGE_STATUS_LABEL[p.status] }}
              </AppBadge>
            </div>
            <h3 class="font-semibold text-emerald-900">
              {{ p.pendoa?.full_name ?? 'Pendoa tidak diketahui' }}
            </h3>
            <p class="text-xs text-emerald-600 mt-0.5">{{ p.pendoa?.email }}</p>
            <p class="text-xs text-emerald-700 mt-2 flex items-center gap-1 flex-wrap">
              <Icon name="calendar" :size="12" />
              {{ formatDate(p.departure_date) }} → {{ formatDate(p.return_date) }}
              <span class="ml-2 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {{ p.prayer_count ?? 0 }} doa
              </span>
            </p>
            <p v-if="p.description" class="text-sm text-emerald-600 mt-1 line-clamp-2">{{ p.description }}</p>
          </div>

          <div class="flex gap-2 flex-shrink-0">
            <AppButton
              :variant="p.status === 'active' ? 'secondary' : 'primary'"
              size="sm"
              @click="toggleStatus(p)"
            >
              <Icon :name="p.status === 'active' ? 'lock' : 'sparkles'" :size="14" />
              {{ p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan' }}
            </AppButton>
            <AppButton
              variant="secondary"
              size="sm"
              @click="router.push({ name: 'pendoa-pilgrimage-edit', params: { id: p.id } })"
            >
              <Icon name="edit" :size="14" />
            </AppButton>
            <AppButton variant="danger" size="sm" @click="toDelete = p; showDelete = true">
              <Icon name="trash" :size="14" />
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>

    <AppModal v-model="showDelete" title="Hapus Perjalanan" size="sm">
      <p class="text-sm text-emerald-700">Hapus perjalanan ini secara permanen?</p>
      <p v-if="toDelete" class="mt-3 p-3 bg-red-50 rounded-lg text-sm">
        <strong>{{ toDelete.pendoa?.full_name }}</strong> —
        {{ PILGRIMAGE_TYPE_LABEL[toDelete.type] }} ({{ formatDate(toDelete.departure_date) }})
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="showDelete = false">Batal</AppButton>
        <AppButton variant="danger" @click="confirmDelete">Hapus</AppButton>
      </template>
    </AppModal>
  </div>
</template>
