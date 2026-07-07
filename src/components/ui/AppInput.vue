<script setup lang="ts">
import { computed, useAttrs } from 'vue'

interface Props {
  modelValue?: string | number
  label?: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  autocomplete?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  required: false,
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const attrs = useAttrs()
const inputId = computed(() => props.id ?? `input-${Math.random().toString(36).slice(2, 9)}`)

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

// suppress unused warning
void attrs
</script>

<template>
  <div>
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <div v-if="$slots.prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
        <slot name="prefix" />
      </div>
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :class="[
          'form-input',
          $slots.prefix ? 'pl-9' : '',
          $slots.suffix ? 'pr-10' : '',
          error ? 'form-input-error' : '',
        ]"
        @input="onInput"
      />
      <div v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2">
        <slot name="suffix" />
      </div>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-else-if="hint" class="form-hint">{{ hint }}</p>
  </div>
</template>
