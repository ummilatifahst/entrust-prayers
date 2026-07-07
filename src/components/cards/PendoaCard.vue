<script setup lang="ts">
import { computed } from 'vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import Icon from '@/components/ui/Icon.vue'
import type { PilgrimageWithPendoa } from '@/types/database'
import { formatDate, PILGRIMAGE_TYPE_LABEL } from '@/utils/format'

const props = defineProps<{
  pilgrimage: PilgrimageWithPendoa
}>()

const emit = defineEmits<{ (e: 'click'): void }>()

const daysUntilDeparture = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dep = new Date(props.pilgrimage.departure_date)
  dep.setHours(0, 0, 0, 0)
  return Math.ceil((dep.getTime() - today.getTime()) / 86400000)
})

const isCurrentlyAway = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dep = new Date(props.pilgrimage.departure_date)
  const ret = new Date(props.pilgrimage.return_date)
  return today >= dep && today <= ret
})
</script>

<template>
  <AppCard hover padding class="cursor-pointer" @click="emit('click')">
    <div class="flex items-start gap-3">
      <AppAvatar
        :name="pilgrimage.pendoa?.full_name ?? '?'"
        :src="pilgrimage.pendoa?.avatar_url"
        size="lg"
      />
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <p class="font-semibold text-emerald-900 truncate">
            {{ pilgrimage.pendoa?.full_name ?? 'Pendoa' }}
          </p>
          <AppBadge :tone="pilgrimage.type === 'haji' ? 'gold' : 'emerald'">
            {{ PILGRIMAGE_TYPE_LABEL[pilgrimage.type] }}
          </AppBadge>
        </div>
        <p v-if="pilgrimage.pendoa?.city" class="text-sm text-emerald-600 flex items-center gap-1 mt-1">
          <Icon name="pin" :size="12" />
          {{ pilgrimage.pendoa.city }}
        </p>
        <p class="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
          <Icon name="calendar" :size="12" />
          {{ formatDate(pilgrimage.departure_date) }} — {{ formatDate(pilgrimage.return_date) }}
        </p>
      </div>
    </div>

    <p v-if="pilgrimage.description" class="text-sm text-emerald-700 mt-3 line-clamp-2">
      {{ pilgrimage.description }}
    </p>

    <div class="mt-3 pt-3 border-t border-emerald-50 flex items-center justify-between">
      <AppBadge v-if="isCurrentlyAway" tone="emerald">
        <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
        Sedang di Tanah Suci
      </AppBadge>
      <AppBadge v-else-if="daysUntilDeparture > 0" tone="gold">
        Berangkat {{ daysUntilDeparture }} hari lagi
      </AppBadge>
      <AppBadge v-else tone="gray">Selesai</AppBadge>

      <span class="text-xs text-emerald-700 font-medium flex items-center gap-1">
        Titip doa
        <Icon name="chevron-right" :size="14" />
      </span>
    </div>
  </AppCard>
</template>
