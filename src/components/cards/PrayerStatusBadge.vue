<script setup lang="ts">
import { computed } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import type { PrayerStatus } from '@/types/database'
import { PRAYER_STATUS_BADGE, PRAYER_STATUS_LABEL } from '@/utils/format'

const props = defineProps<{ status: PrayerStatus }>()

const tone = computed(() => ({
  'badge-emerald': 'emerald',
  'badge-gold':    'gold',
  'badge-gray':    'gray',
  'badge-blue':    'blue',
  'badge-red':     'red',
}[PRAYER_STATUS_BADGE[props.status]] as 'emerald' | 'gold' | 'gray' | 'blue' | 'red'))
</script>

<template>
  <AppBadge :tone="tone">{{ PRAYER_STATUS_LABEL[status] }}</AppBadge>
</template>
