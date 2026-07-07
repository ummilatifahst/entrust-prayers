<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { fetchMyPilgrimages, deletePilgrimage, updatePilgrimage } from '@/services/pilgrimage.service'
import type { Pilgrimage } from '@/types/database'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import { formatDate, PILGRIMAGE_STATUS_LABEL, PILGRIMAGE_TYPE_LABEL } from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const loading = ref(true)
const pilgrimages = ref<Pilgrimage[]>([])
const toDelete = ref<Pilgrimage | null>(null)
const showDelete = ref(false)

async function load() {
  if (!auth.user) return
  loading.value = true
  try {
    pilgrimages.value = await fetchMyPilgrimages(auth.user.id)
  } finally {
    loading.value = false
  }
}

async function toggleStatus(p: Pilgrimage) {
  const newStatus = p.status === 'active' ? 'draft' : 'active'
  try {
    const updated = await updatePilgrimage(p.id, { status: newStatus })
    Object.assign(p, updated)
    ui.success(newStatus === 'active' ? 'Perjalanan diaktifkan — siap menerima doa.' : 'Perjalanan dijadikan draf.')
  } catch (e) {
    ui.error('Gagal mengubah status')
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await deletePilgrimage(toDelete.value.id)
    pilgrimages.value = pilgrimages.value.filter((p) => p.id !== toDelete.value!.id)
    ui.success('Perjalanan dihapus.')
    showDelete.value = false
    toDelete.value = null
  } catch (e) {
    ui.error('Gagal menghapus perjalanan')
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
      <div>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">Perjalanan Ibadah</h1>
        <p class="text-sm text-emerald-600">Kelola perjalanan Anda agar menerima titipan doa</p>
      </div>
      <AppButton variant="primary" @click="router.push({ name: 'pendoa-pilgrimage-new' })">
        <Icon name="plus" :size="16" />
        <span class="hidden sm:inline">Buat Baru</span>
      </AppButton>
    </header>

    <AppCard v-if="loading" padding><Spinner size="lg" /></AppCard>

    <AppCard v-else-if="pilgrimages.length === 0" padding>
      <EmptyState
        icon="🗺️"
        title="Belum ada perjalanan"
        description="Buat perjalanan ibadah pertama Anda untuk menerima titipan doa dari penitip."
      >
        <template #action>
          <AppButton variant="primary" @click="router.push({ name: 'pendoa-pilgrimage-new' })">
            <Icon name="plus" :size="16" />
            Buat Perjalanan
          </AppButton>
        </template>
      </EmptyState>
    </AppCard>

    <div v-else class="space-y-3">
      <AppCard
        v-for="p in pilgrimages"
        :key="p.id"
        padding
        hover
        class="!p-4"
        @click="router.push({ name: 'pendoa-pilgrimage-edit', params: { id: p.id } })"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <AppBadge :tone="p.type === 'haji' ? 'gold' : 'emerald'">
                {{ PILGRIMAGE_TYPE_LABEL[p.type] }}
              </AppBadge>
              <AppBadge :tone="p.status === 'active' ? 'emerald' : p.status === 'draft' ? 'gold' : 'gray'">
                {{ PILGRIMAGE_STATUS_LABEL[p.status] }}
              </AppBadge>
            </div>
            <p class="text-sm text-emerald-700 mt-2 flex items-center gap-1">
              <Icon name="calendar" :size="12" />
              {{ formatDate(p.departure_date) }} → {{ formatDate(p.return_date) }}
            </p>
            <p v-if="p.description" class="text-sm text-emerald-600 mt-1 line-clamp-1">{{ p.description }}</p>
          </div>
          <Icon name="chevron-right" :size="18" class="text-emerald-400 flex-shrink-0" />
        </div>

        <div class="mt-3 pt-3 border-t border-emerald-50 flex justify-end gap-2" @click.stop>
          <AppButton
            :variant="p.status === 'active' ? 'secondary' : 'primary'"
            size="sm"
            @click="toggleStatus(p)"
          >
            <Icon :name="p.status === 'active' ? 'lock' : 'sparkles'" :size="14" />
            {{ p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan' }}
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            @click="toDelete = p; showDelete = true"
          >
            <Icon name="trash" :size="14" />
          </AppButton>
        </div>
      </AppCard>
    </div>

    <AppModal v-model="showDelete" title="Hapus Perjalanan" size="sm">
      <p class="text-sm text-emerald-700">
        Yakin ingin menghapus perjalanan ini? Semua titipan doa terkait juga akan terpengaruh.
      </p>
      <template #footer>
        <AppButton variant="ghost" @click="showDelete = false">Batal</AppButton>
        <AppButton variant="danger" @click="confirmDelete">
          <Icon name="trash" :size="14" />
          Hapus
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
