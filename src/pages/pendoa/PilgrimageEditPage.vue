<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import {
  createPilgrimage,
  fetchPilgrimageById,
  updatePilgrimage,
} from '@/services/pilgrimage.service'
import type { PilgrimageType, PilgrimageStatus } from '@/types/database'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppCard from '@/components/ui/AppCard.vue'
import Icon from '@/components/ui/Icon.vue'
import Spinner from '@/components/ui/Spinner.vue'
import { formatDateForInput } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)

const form = reactive<{
  type: PilgrimageType
  departure_date: string
  return_date: string
  description: string
  status: PilgrimageStatus
}>({
  type: 'umroh',
  departure_date: '',
  return_date: '',
  description: '',
  status: 'draft',
})

const errors = reactive<Record<string, string | undefined>>({})

function validate() {
  errors.departure_date = !form.departure_date ? 'Tanggal berangkat wajib diisi' : undefined
  errors.return_date = !form.return_date ? 'Tanggal pulang wajib diisi'
    : form.departure_date && form.return_date < form.departure_date
    ? 'Tanggal pulang harus setelah berangkat' : undefined
  return !errors.departure_date && !errors.return_date
}

async function load() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const p = await fetchPilgrimageById(route.params.id as string)
    if (p) {
      form.type = p.type
      form.departure_date = formatDateForInput(p.departure_date)
      form.return_date = formatDateForInput(p.return_date)
      form.description = p.description
      form.status = p.status
    }
  } finally {
    loading.value = false
  }
}

async function submit(status?: PilgrimageStatus) {
  if (!validate() || !auth.user) return
  saving.value = true
  const payload = { ...form, status: status ?? form.status }
  try {
    if (isEdit.value) {
      await updatePilgrimage(route.params.id as string, payload)
      ui.success('Perjalanan diperbarui!')
    } else {
      await createPilgrimage(auth.user.id, payload)
      ui.success(status === 'active' ? 'Perjalanan dibuat & diaktifkan!' : 'Perjalanan dibuat sebagai draf.')
    }
    router.push({ name: 'pendoa-pilgrimages' })
  } catch (e) {
    const err = e as { message?: string }
    ui.error(err.message ?? 'Gagal menyimpan perjalanan')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await auth.init()
  await load()
})
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <AppButton variant="ghost" size="sm" class="mb-3" @click="router.back()">
      <Icon name="arrow-left" :size="16" />
      Kembali
    </AppButton>

    <header class="mb-5">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-emerald-900">
        {{ isEdit ? 'Edit Perjalanan' : 'Buat Perjalanan Ibadah' }}
      </h1>
      <p class="text-sm text-emerald-600 mt-1">
        Sampaikan detail perjalanan agar penitip yakin menitipkan doa.
      </p>
    </header>

    <AppCard padding>
      <Spinner v-if="loading" size="lg" />

      <form v-else @submit.prevent="submit()" class="space-y-5">
        <!-- Type -->
        <div>
          <label class="form-label">Jenis Ibadah <span class="text-red-500">*</span></label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition',
                form.type === 'umroh' ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:border-emerald-300',
              ]"
              @click="form.type = 'umroh'"
            >
              <Icon name="kaaba" :size="22" :class="form.type === 'umroh' ? 'text-emerald-600' : 'text-emerald-400'" />
              <span class="font-semibold text-sm text-emerald-900">Umroh</span>
            </button>
            <button
              type="button"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition',
                form.type === 'haji' ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 hover:border-emerald-300',
              ]"
              @click="form.type = 'haji'"
            >
              <Icon name="kaaba" :size="22" :class="form.type === 'haji' ? 'text-emerald-600' : 'text-emerald-400'" />
              <span class="font-semibold text-sm text-emerald-900">Haji</span>
            </button>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <AppInput
            v-model="form.departure_date"
            label="Tanggal Berangkat"
            type="date"
            required
            :error="errors.departure_date"
          />
          <AppInput
            v-model="form.return_date"
            label="Tanggal Pulang"
            type="date"
            required
            :error="errors.return_date"
          />
        </div>

        <AppTextarea
          v-model="form.description"
          label="Deskripsi"
          placeholder="Misal: Umroh reguler 9 hari, berangkat dari Jakarta. Insya Allah akan singgah di Raudhah & Jabal Uhud."
          :rows="4"
          :maxlength="500"
          hint="Sertakan info penting seperti maskapai, travel, atau rencana ziarah."
        />

        <div v-if="isEdit" class="bg-emerald-50/60 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700">
          <Icon name="info" :size="16" />
          Status saat ini: <strong class="capitalize">{{ form.status }}</strong>
        </div>

        <div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <AppButton variant="ghost" type="button" @click="router.back()">Batal</AppButton>
          <AppButton variant="secondary" :loading="saving" @click="submit('draft')">
            <Icon name="edit" :size="16" />
            Simpan sebagai Draf
          </AppButton>
          <AppButton variant="primary" :loading="saving" @click="submit('active')">
            <Icon name="sparkles" :size="16" />
            Aktifkan
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
