<script setup lang="ts">
import { useUiStore } from '@/stores/ui.store'
import Icon from './Icon.vue'

const ui = useUiStore()

const iconName = (t: string) =>
  t === 'success' ? 'check-circle' : t === 'error' ? 'x-circle' : 'info'

const toneClass = (t: string) =>
  t === 'success'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : t === 'error'
    ? 'bg-red-50 text-red-800 border-red-200'
    : 'bg-blue-50 text-blue-800 border-blue-200'
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-4"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="t in ui.toasts"
          :key="t.id"
          :class="['pointer-events-auto px-4 py-3 rounded-xl border shadow-lg flex items-start gap-3', toneClass(t.type)]"
        >
          <Icon :name="iconName(t.type)" :size="20" class="flex-shrink-0 mt-0.5" />
          <p class="text-sm flex-1">{{ t.message }}</p>
          <button
            class="opacity-50 hover:opacity-100 transition text-lg leading-none"
            @click="ui.dismiss(t.id)"
            aria-label="Tutup"
          >×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
