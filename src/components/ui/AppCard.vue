<script setup lang="ts">
withDefaults(defineProps<{ hover?: boolean; padding?: boolean }>(), {
  hover: false,
  padding: true,
})
</script>

<template>
  <div
    :class="[
      hover ? 'card-hover' : 'card',
      padding ? '' : 'p-0',
    ]"
  >
    <slot />
  </div>
</template>
