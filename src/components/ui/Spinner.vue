<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  label?: string
}>(), {
  size: 'md',
})
</script>

<template>
  <div class="flex items-center justify-center gap-2 text-emerald-600 py-4">
    <svg
      :class="['animate-spin', size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6']"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <span v-if="label" class="text-sm">{{ label }}</span>
  </div>
</template>
