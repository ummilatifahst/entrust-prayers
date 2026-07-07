<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  disabled?: boolean
}>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  block: false,
  loading: false,
  disabled: false,
})

const variantClass = computed(() => ({
  primary: 'btn-primary',
  gold: 'btn-gold',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}[props.variant]))

const sizeClass = computed(() => ({
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}[props.size]))

const blockClass = computed(() => props.block ? 'w-full' : '')
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[variantClass, sizeClass, blockClass]"
  >
    <svg
      v-if="loading"
      class="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>
