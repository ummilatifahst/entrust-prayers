<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { fetchMyPilgrimages } from '@/services/pilgrimage.service'
import { fetchReceivedPrayers } from '@/services/prayer.service'
import type { Pilgrimage, PrayerWithRelations } from '@/types/database'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import { formatDate, PILGRIMAGE_STATUS_LABEL, PILGRIMAGE_TYPE_LABEL } from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const pilgrimages = ref<Pilgrimage[]>([])
const prayers = ref<PrayerWithRelations[]>([])

const stats = computed(() => ({
  pilgrimages: pilgrimages.value.length,
  active: pilgrimages.value.filter((p) => p.status === 'active').length,
  incoming: prayers.value.length,
  prayed: prayers.value.filter((p) => p.status === 'prayed' || p.status === 'completed').length,
}))

async function load() {
  if (!auth.user) return
  loading.value = true
  try {
    const [p, pr] = await Promise.all([
      fetchMyPilgrimages(auth.user.id),
      fetchReceivedPrayers(auth.user.id),
    ])
    pilgrimages.value = p
    prayers.value = pr
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
    <header class="mb-6 flex items-center justify-between gap-3 flex-wrap">
      <div>
        <p class="text-sm text-emerald-600">Assalamu'alaikum,</p>
        <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">
          {{ auth.displayName }} 🕋
        </h1>
        <p class="text-sm text-emerald-600 mt-1">
          Semoga setiap doa yang Anda amanahkan menjadi berkah.
        </p>
      </div>
      <AppButton variant="primary" @click="router.push({ name: 'pendoa-pilgrimage-new' })">
        <Icon name="plus" :size="16" />
        Buat Perjalanan
      </AppButton>
    </header>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <AppCard padding>
        <p class="text-xs text-emerald-600">Total Perjalanan</p>
        <p class="text-2xl font-bold text-emerald-900 mt-1">{{ stats.pilgrimages }}</p>
      </AppCard>
      <AppCard padding>
        <p class="text-xs text-emerald-600">Aktif</p>
        <p class="text-2xl font-bold text-emerald-700 mt-1">{{ stats.active }}</p>
      </AppCard>
      <AppCard padding>
        <p class="text-xs text-emerald-600">Doa Masuk</p>
        <p class="text-2xl font-bold text-gold-700 mt-1">{{ stats.incoming }}</p>
      </AppCard>
      <AppCard padding>
        <p class="text-xs text-emerald-600">Sudah Didoakan</p>
        <p class="text-2xl font-bold text-emerald-700 mt-1">{{ stats.prayed }}</p>
      </AppCard>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Active pilgrimages -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-emerald-900">Perjalanan Saya</h2>
          <AppButton variant="ghost" size="sm" @click="router.push({ name: 'pendoa-pilgrimages' })">
            Lihat semua
            <Icon name="chevron-right" :size="14" />
          </AppButton>
        </div>

        <AppCard v-if="loading" padding><Spinner /></AppCard>
        <AppCard v-else-if="pilgrimages.length === 0" padding>
          <EmptyState
            icon="🗺️"
            title="Belum ada perjalanan"
            description="Buat perjalanan ibadah pertama Anda untuk menerima titipan doa."
          >
            <template #action>
              <AppButton variant="primary" size="sm" @click="router.push({ name: 'pendoa-pilgrimage-new' })">
                <Icon name="plus" :size="14" />
                Buat Perjalanan
              </AppButton>
            </template>
          </EmptyState>
        </AppCard>

        <div v-else class="space-y-2">
          <AppCard
            v-for="p in pilgrimages.slice(0, 3)"
            :key="p.id"
            padding
            hover
            class="!p-4 cursor-pointer"
            @click="router.push({ name: 'pendoa-pilgrimage-edit', params: { id: p.id } })"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold text-emerald-900">
                {{ PILGRIMAGE_TYPE_LABEL[p.type] }}
              </p>
              <AppBadge :tone="p.status === 'active' ? 'emerald' : p.status === 'draft' ? 'gold' : 'gray'">
                {{ PILGRIMAGE_STATUS_LABEL[p.status] }}
              </AppBadge>
            </div>
            <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <Icon name="calendar" :size="12" />
              {{ formatDate(p.departure_date) }} → {{ formatDate(p.return_date) }}
            </p>
          </AppCard>
        </div>
      </div>

      <!-- Incoming prayers -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-display font-bold text-emerald-900">Titipan Masuk</h2>
          <AppButton variant="ghost" size="sm" @click="router.push({ name: 'pendoa-prayers' })">
            Lihat semua
            <Icon name="chevron-right" :size="14" />
          </AppButton>
        </div>

        <AppCard v-if="loading" padding><Spinner /></AppCard>
        <AppCard v-else-if="prayers.length === 0" padding>
          <EmptyState
            icon="📭"
            title="Belum ada titipan masuk"
            description="Aktifkan perjalanan Anda agar menerima doa."
          />
        </AppCard>

        <div v-else class="space-y-2">
          <AppCard
            v-for="p in prayers.slice(0, 5)"
            :key="p.id"
            padding
            class="!p-4"
          >
            <p class="font-semibold text-emerald-900 text-sm truncate">{{ p.title }}</p>
            <p class="text-xs text-emerald-600 mt-1">
              Dari: {{ p.is_anonymous ? 'Anonim' : (p.sender?.full_name ?? 'Penitip') }}
            </p>
          </AppCard>
        </div>
      </div>
    </div>
  </div>
</template>
