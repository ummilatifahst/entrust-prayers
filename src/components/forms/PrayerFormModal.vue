<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import Icon from '@/components/ui/Icon.vue'
import { minLen } from '@/utils/validation'
import type { PilgrimageWithPendoa } from '@/types/database'

const props = defineProps<{
  modelValue: boolean
  pilgrimage: PilgrimageWithPendoa | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'submit', payload: {
    title: string
    content: string
    is_private: boolean
    is_anonymous: boolean
  }): void
}>()

const form = reactive({
  title: '',
  content: '',
  is_private: false,
  is_anonymous: false,
})
const errors = reactive<{ title?: string; content?: string }>({})
const submitting = ref(false)

watch(() => props.modelValue, (open) => {
  if (open) {
    form.title = ''
    form.content = ''
    form.is_private = false
    form.is_anonymous = false
    errors.title = undefined
    errors.content = undefined
  }
})

function validate() {
  errors.title = !form.title ? 'Judul wajib diisi'
              : !minLen(form.title, 3) ? 'Judul minimal 3 karakter' : undefined
  errors.content = !form.content ? 'Isi doa wajib diisi'
                : !minLen(form.content, 10) ? 'Isi doa minimal 10 karakter' : undefined
  return !errors.title && !errors.content
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    emit('submit', {
      title: form.title.trim(),
      content: form.content.trim(),
      is_private: form.is_private,
      is_anonymous: form.is_anonymous,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="Titip Doa"
    size="lg"
  >
    <div v-if="pilgrimage" class="space-y-4">
      <div class="bg-emerald-50/60 rounded-xl p-3 flex items-center gap-3 text-sm text-emerald-700">
        <Icon name="kaaba" :size="20" class="flex-shrink-0" />
        <span>
          Kepada: <strong>{{ pilgrimage.pendoa?.full_name }}</strong>
          ({{ pilgrimage.type === 'haji' ? 'Haji' : 'Umroh' }})
        </span>
      </div>

      <AppInput
        v-model="form.title"
        label="Judul Doa"
        placeholder="Misal: Doa kesehatan orang tua"
        required
        :error="errors.title"
        :maxlength="100"
      />

      <AppTextarea
        v-model="form.content"
        label="Isi Doa"
        placeholder="Tuliskan doa Anda dengan sepenuh hati..."
        :rows="5"
        :maxlength="1000"
        required
        :error="errors.content"
      />

      <div class="space-y-2">
        <label class="flex items-start gap-3 p-3 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-50/40">
          <input
            v-model="form.is_private"
            type="checkbox"
            class="mt-0.5 rounded border-emerald-300 text-emerald-600"
          />
          <div>
            <p class="text-sm font-medium text-emerald-900">Doa Privat</p>
            <p class="text-xs text-emerald-600">Hanya Anda dan pendoa yang bisa membaca doa ini.</p>
          </div>
        </label>

        <label class="flex items-start gap-3 p-3 rounded-xl border border-emerald-100 cursor-pointer hover:bg-emerald-50/40">
          <input
            v-model="form.is_anonymous"
            type="checkbox"
            class="mt-0.5 rounded border-emerald-300 text-emerald-600"
          />
          <div>
            <p class="text-sm font-medium text-emerald-900">Kirim Anonim</p>
            <p class="text-xs text-emerald-600">Nama Anda tidak akan ditampilkan kepada pendoa.</p>
          </div>
        </label>
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" @click="emit('update:modelValue', false)">Batal</AppButton>
      <AppButton variant="primary" :loading="submitting" @click="submit">
        <Icon name="send" :size="16" />
        Kirim Doa
      </AppButton>
    </template>
  </AppModal>
</template>
