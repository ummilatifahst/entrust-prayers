<script setup lang="ts">
import { computed } from 'vue'
import { initials as toInitials } from '@/utils/format'

const props = withDefaults(defineProps<{
  name?: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  name: '',
  size: 'md',
})

const sizeClass = computed(() => ({
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}[props.size]))
</script>

<template>
  <div
    :class="[
      'inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold overflow-hidden ring-2 ring-white',
      sizeClass,
    ]"
  >
    <img v-if="src" :src="src" :alt="name" class="h-full w-full object-cover" />
    <span v-else>{{ toInitials(name) }}</span>
  </div>
</template>
