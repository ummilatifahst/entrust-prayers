<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchActivePilgrimages } from '@/services/pilgrimage.service'
import type { PilgrimageWithPendoa, PilgrimageType } from '@/types/database'
import PendoaCard from '@/components/cards/PendoaCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()

const loading = ref(true)
const pilgrimages = ref<PilgrimageWithPendoa[]>([])
const search = ref('')
const filterType = ref<PilgrimageType | 'all'>('all')

const filtered = computed(() => {
  let list = pilgrimages.value
  if (filterType.value !== 'all') {
    list = list.filter((p) => p.type === filterType.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) =>
      (p.pendoa?.full_name ?? '').toLowerCase().includes(q) ||
      (p.pendoa?.city ?? '').toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    )
  }
  return list
})

async function load() {
  loading.value = true
  try {
    pilgrimages.value = await fetchActivePilgrimages()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <header class="mb-6">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">Daftar Pendoa Aktif</h1>
      <p class="text-sm text-emerald-600 mt-1">Pilih jamaah untuk menitipkan doa Anda</p>
    </header>

    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <div class="flex-1">
        <AppInput
          v-model="search"
          placeholder="Cari nama pendoa, kota, atau deskripsi..."
        >
          <template #prefix><Icon name="users" :size="16" /></template>
        </AppInput>
      </div>
      <div class="inline-flex rounded-xl bg-white border border-emerald-200 p-1 self-start">
        <button
          v-for="opt in [{ v: 'all', l: 'Semua' }, { v: 'haji', l: 'Haji' }, { v: 'umroh', l: 'Umroh' }]"
          :key="opt.v"
          :class="[
            'px-3 py-1.5 text-sm rounded-lg transition',
            filterType === opt.v ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50',
          ]"
          @click="filterType = opt.v as PilgrimageType | 'all'"
        >
          {{ opt.l }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="card"><Spinner size="lg" /></div>

    <div v-else-if="filtered.length === 0" class="card">
      <EmptyState
        icon="🕋"
        title="Tidak ada pendoa ditemukan"
        :description="search ? 'Coba kata kunci lain.' : 'Belum ada jamaah yang aktif saat ini.'"
      />
    </div>

    <div v-else class="grid sm:grid-cols-2 gap-4">
      <PendoaCard
        v-for="p in filtered"
        :key="p.id"
        :pilgrimage="p"
        @click="router.push({ name: 'penitip-pendoa-detail', params: { id: p.id } })"
      />
    </div>
  </div>
</template>
