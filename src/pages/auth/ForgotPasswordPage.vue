<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { resetPassword } from '@/services/auth.service'
import { useUiStore } from '@/stores/ui.store'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import Icon from '@/components/ui/Icon.vue'
import { isEmail } from '@/utils/validation'

const router = useRouter()
const ui = useUiStore()

const form = reactive({ email: '' })
const error = ref<string | undefined>()
const loading = ref(false)
const sent = ref(false)

async function submit() {
  if (!form.email) { error.value = 'Email wajib diisi'; return }
  if (!isEmail(form.email)) { error.value = 'Format email tidak valid'; return }

  loading.value = true
  try {
    await resetPassword(form.email)
    sent.value = true
    ui.success('Tautan reset password telah dikirim!')
  } catch (e) {
    const err = e as { message?: string }
    ui.error(err.message ?? 'Gagal mengirim email reset')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gold-50 px-4 py-8">
    <div class="w-full max-w-md">
      <button class="flex items-center gap-2 mb-6 mx-auto" @click="router.push({ name: 'landing' })">
        <div class="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
          <Icon name="kaaba" :size="22" />
        </div>
      </button>

      <div class="card animate-slide-up">
        <template v-if="!sent">
          <h1 class="text-2xl font-display font-bold text-emerald-900 text-center">Lupa Password?</h1>
          <p class="text-sm text-emerald-600 text-center mt-1 mb-6">
            Masukkan email Anda — kami akan kirim tautan reset password.
          </p>

          <form @submit.prevent="submit" class="space-y-4">
            <AppInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="nama@email.com"
              autocomplete="email"
              required
              :error="error"
            />
            <AppButton type="submit" block size="lg" :loading="loading">
              <Icon name="mail" :size="18" />
              Kirim Tautan Reset
            </AppButton>
          </form>

          <p class="text-center text-sm text-emerald-600 mt-6">
            <router-link :to="{ name: 'login' }" class="text-emerald-700 font-semibold hover:underline">
              ← Kembali ke halaman masuk
            </router-link>
          </p>
        </template>

        <div v-else class="text-center py-4">
          <div class="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <Icon name="mail" :size="32" />
          </div>
          <h2 class="text-2xl font-display font-bold text-emerald-900">Cek Email Anda</h2>
          <p class="text-sm text-emerald-600 mt-2 mb-6">
            Tautan reset password telah dikirim ke <strong>{{ form.email }}</strong>.
          </p>
          <AppButton variant="primary" block @click="router.push({ name: 'login' })">
            Ke Halaman Masuk
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
