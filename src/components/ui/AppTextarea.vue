<script setup lang="ts">
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  error?: string
  hint?: string
  required?: boolean
  rows?: number
  maxlength?: number
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  required: false,
  rows: 4,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()
const inputId = `ta-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <div>
    <label v-if="label" :for="inputId" class="form-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <textarea
      :id="inputId"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :rows="rows"
      :maxlength="maxlength"
      :class="['form-input resize-none', error ? 'form-input-error' : '']"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <div class="flex justify-between mt-1">
      <p v-if="error" class="form-error">{{ error }}</p>
      <p v-else-if="hint" class="form-hint">{{ hint }}</p>
      <p v-if="maxlength" class="form-hint ml-auto">{{ modelValue.length }}/{{ maxlength }}</p>
    </div>
  </div>
</template>
