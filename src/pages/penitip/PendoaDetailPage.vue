<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { fetchPilgrimageDetail } from '@/services/pilgrimage.service'
import { createPrayer } from '@/services/prayer.service'
import type { PilgrimageWithPendoa } from '@/types/database'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import PrayerFormModal from '@/components/forms/PrayerFormModal.vue'
import Spinner from '@/components/ui/Spinner.vue'
import Icon from '@/components/ui/Icon.vue'
import { formatDate, PILGRIMAGE_TYPE_LABEL } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const pilgrimage = ref<PilgrimageWithPendoa | null>(null)
const loading = ref(true)
const showForm = ref(false)

async function load() {
  loading.value = true
  try {
    pilgrimage.value = await fetchPilgrimageDetail(route.params.id as string)
  } finally {
    loading.value = false
  }
}

async function onSubmit(payload: {
  title: string
  content: string
  is_private: boolean
  is_anonymous: boolean
}) {
  if (!auth.user || !pilgrimage.value) return
  try {
    await createPrayer(auth.user.id, {
      receiver_id: pilgrimage.value.user_id,
      pilgrimage_id: pilgrimage.value.id,
      title: payload.title,
      content: payload.content,
      is_private: payload.is_private,
      is_anonymous: payload.is_anonymous,
    })
    ui.success('Doa Anda telah dititipkan. Tunggu kabar dari pendoa.')
    showForm.value = false
    router.push({ name: 'penitip-prayers' })
  } catch (e) {
    const err = e as { message?: string }
    ui.error(err.message ?? 'Gagal mengirim doa')
  }
}

const pendoaName = computed(() => pilgrimage.value?.pendoa?.full_name ?? 'Pendooa')

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div>
    <AppButton variant="ghost" size="sm" class="mb-3" @click="router.back()">
      <Icon name="arrow-left" :size="16" />
      Kembali
    </AppButton>

    <div v-if="loading" class="card"><Spinner size="lg" /></div>

    <template v-else-if="pilgrimage">
      <AppCard padding class="mb-5">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <AppAvatar
            :name="pendoaName"
            :src="pilgrimage.pendoa?.avatar_url"
            size="xl"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl sm:text-2xl font-display font-bold text-emerald-900">
                {{ pendoaName }}
              </h1>
              <AppBadge :tone="pilgrimage.type === 'haji' ? 'gold' : 'emerald'">
                {{ PILGRIMAGE_TYPE_LABEL[pilgrimage.type] }}
              </AppBadge>
            </div>
            <p v-if="pilgrimage.pendoa?.city" class="text-sm text-emerald-600 flex items-center gap-1 mt-1">
              <Icon name="pin" :size="12" />
              {{ pilgrimage.pendoa.city }}
            </p>
          </div>
        </div>

        <hr class="border-emerald-100 my-4" />

        <div class="grid sm:grid-cols-2 gap-3 text-sm">
          <div class="flex items-center gap-2 text-emerald-700">
            <Icon name="calendar" :size="16" class="text-emerald-500" />
            <span>Berangkat: <strong>{{ formatDate(pilgrimage.departure_date) }}</strong></span>
          </div>
          <div class="flex items-center gap-2 text-emerald-700">
            <Icon name="calendar" :size="16" class="text-emerald-500" />
            <span>Pulang: <strong>{{ formatDate(pilgrimage.return_date) }}</strong></span>
          </div>
        </div>

        <p v-if="pilgrimage.description" class="text-sm text-emerald-700 mt-4 leading-relaxed">
          {{ pilgrimage.description }}
        </p>
      </AppCard>

      <AppCard padding v-if="pilgrimage.pendoa?.bio" class="mb-5">
        <h3 class="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
          <Icon name="user" :size="16" />
          Tentang Pendoa
        </h3>
        <p class="text-sm text-emerald-700 leading-relaxed">{{ pilgrimage.pendoa.bio }}</p>
      </AppCard>

      <div class="text-center">
        <AppButton variant="primary" size="lg" @click="showForm = true">
          <Icon name="send" :size="18" />
          Titip Doa ke {{ pendoaName }}
        </AppButton>
      </div>

      <PrayerFormModal
        v-model="showForm"
        :pilgrimage="pilgrimage"
        @submit="onSubmit"
      />
    </template>

    <AppCard v-else padding>
      <p class="text-center text-emerald-700">Pendoa tidak ditemukan.</p>
    </AppCard>
  </div>
</template>
