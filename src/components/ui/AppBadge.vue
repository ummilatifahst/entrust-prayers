<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'emerald' | 'gold' | 'gray' | 'blue' | 'red'

const props = withDefaults(defineProps<{
  tone?: Tone
  label?: string
}>(), {
  tone: 'emerald',
})

const cls = computed(() => ({
  emerald: 'badge-emerald',
  gold: 'badge-gold',
  gray: 'badge-gray',
  blue: 'badge-blue',
  red: 'badge-red',
}[props.tone]))
</script>

<template>
  <span :class="cls">
    <slot>{{ label }}</slot>
  </span>
</template>
