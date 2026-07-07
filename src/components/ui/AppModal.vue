<script setup lang="ts">
import { watch, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
  closeOnBackdrop?: boolean
}>(), {
  size: 'md',
  closeOnBackdrop: true,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

function close() {
  emit('update:modelValue', false)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(() => props.modelValue, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})

const sizeClass = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}[props.size]
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-sm"
        @click.self="closeOnBackdrop && close()"
      >
        <div
          :class="['w-full bg-white rounded-2xl shadow-2xl animate-slide-up', sizeClass]"
          role="dialog"
          aria-modal="true"
        >
          <div v-if="title" class="flex items-center justify-between px-5 py-4 border-b border-emerald-100">
            <h3 class="text-lg font-semibold text-emerald-900">{{ title }}</h3>
            <button class="text-emerald-400 hover:text-emerald-700" @click="close" aria-label="Tutup">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-5">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-4 border-t border-emerald-100 flex justify-end gap-2 bg-emerald-50/40 rounded-b-2xl">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
