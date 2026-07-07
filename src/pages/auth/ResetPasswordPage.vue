<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { updatePassword } from '@/services/auth.service'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import Icon from '@/components/ui/Icon.vue'
import { minLen } from '@/utils/validation'

const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()

const form = reactive({ password: '', confirm: '' })
const errors = reactive<{ password?: string; confirm?: string }>({})
const loading = ref(false)
const show = ref(false)

function validate() {
  errors.password = !form.password ? 'Password wajib diisi'
                  : !minLen(form.password, 6) ? 'Password minimal 6 karakter' : undefined
  errors.confirm  = !form.confirm  ? 'Konfirmasi wajib diisi'
                  : form.password !== form.confirm ? 'Password tidak cocok' : undefined
  return !errors.password && !errors.confirm
}

async function submit() {
  if (!validate()) return
  loading.value = true
  try {
    await updatePassword(form.password)
    await auth.logout()
    ui.success('Password berhasil diubah. Silakan masuk kembali.')
    router.push({ name: 'login' })
  } catch (e) {
    const err = e as { message?: string }
    ui.error(err.message ?? 'Gagal mengubah password')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gold-50 px-4 py-8">
    <div class="w-full max-w-md">
      <div class="card animate-slide-up">
        <h1 class="text-2xl font-display font-bold text-emerald-900 text-center">Reset Password</h1>
        <p class="text-sm text-emerald-600 text-center mt-1 mb-6">Masukkan password baru Anda</p>

        <form @submit.prevent="submit" class="space-y-4">
          <AppInput
            v-model="form.password"
            :label="'Password Baru'"
            :type="show ? 'text' : 'password'"
            placeholder="Min. 6 karakter"
            autocomplete="new-password"
            required
            :error="errors.password"
          />
          <AppInput
            v-model="form.confirm"
            label="Ulangi Password Baru"
            :type="show ? 'text' : 'password'"
            placeholder="••••••••"
            autocomplete="new-password"
            required
            :error="errors.confirm"
          />
          <label class="flex items-center gap-2 text-sm text-emerald-700">
            <input v-model="show" type="checkbox" class="rounded border-emerald-300" />
            Tampilkan password
          </label>

          <AppButton type="submit" block size="lg" :loading="loading">
            <Icon name="lock" :size="18" />
            Simpan Password Baru
          </AppButton>
        </form>
      </div>
    </div>
  </div>
</template>
