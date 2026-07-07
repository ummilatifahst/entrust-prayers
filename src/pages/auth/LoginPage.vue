<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import Icon from '@/components/ui/Icon.vue'
import { isEmail } from '@/utils/validation'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const form = reactive({ email: '', password: '' })
const errors = reactive<{ email?: string; password?: string }>({})
const showPassword = ref(false)

function validate() {
  errors.email    = !form.email    ? 'Email wajib diisi'
                   : !isEmail(form.email) ? 'Format email tidak valid' : undefined
  errors.password = !form.password ? 'Password wajib diisi' : undefined
  return !errors.email && !errors.password
}

async function submit() {
  if (!validate()) return
  try {
    await auth.signInWithEmail(form.email, form.password)
    ui.success('Selamat datang kembali!')
    const redirect = (route.query.redirect as string) || (auth.isPendoa ? '/app/pendoa/dashboard' : '/app/penitip/dashboard')
    router.push(redirect)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Gagal masuk'
    ui.error(msg)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gold-50 px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <button class="flex items-center gap-2 mb-8 mx-auto" @click="router.push({ name: 'landing' })">
        <div class="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
          <Icon name="kaaba" :size="22" />
        </div>
        <div class="text-left">
          <p class="font-display font-bold text-emerald-900">Entrust Prayers</p>
          <p class="text-xs text-emerald-600">Titip doa ke Tanah Suci</p>
        </div>
      </button>

      <div class="card animate-slide-up">
        <h1 class="text-2xl font-display font-bold text-emerald-900 text-center">Masuk</h1>
        <p class="text-sm text-emerald-600 text-center mt-1 mb-6">Silakan masuk untuk melanjutkan</p>

        <form @submit.prevent="submit" class="space-y-4">
          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
            :error="errors.email"
          >
            <template #prefix><Icon name="mail" :size="16" class="text-emerald-400" /></template>
          </AppInput>

          <div>
            <label class="form-label">Password <span class="text-red-500">*</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                <Icon name="lock" :size="16" />
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                required
                :class="['form-input pl-9 pr-10', errors.password ? 'form-input-error' : '']"
                @input="errors.password = undefined"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              >
                <Icon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
            <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
          </div>

          <div class="flex justify-end">
            <router-link :to="{ name: 'forgot-password' }" class="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
              Lupa password?
            </router-link>
          </div>

          <AppButton type="submit" block size="lg" :loading="auth.loading">
            <Icon name="logout" :size="18" />
            Masuk
          </AppButton>
        </form>

        <p class="text-center text-sm text-emerald-600 mt-6">
          Belum punya akun?
          <router-link :to="{ name: 'register' }" class="text-emerald-700 font-semibold hover:underline">
            Daftar di sini
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
