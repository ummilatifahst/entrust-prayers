<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  icon?: string
}>(), {
  icon: '📭',
})
</script>

<template>
  <div class="text-center py-12 px-4">
    <div class="text-5xl mb-3">{{ icon }}</div>
    <h3 class="text-base font-semibold text-emerald-900">{{ title }}</h3>
    <p v-if="description" class="text-sm text-emerald-600 mt-1 max-w-sm mx-auto">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
