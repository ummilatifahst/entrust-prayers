<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import Icon from '@/components/ui/Icon.vue'
import { isEmail, minLen } from '@/utils/validation'
import type { UserRole } from '@/types/database'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

type Role = Exclude<UserRole, 'admin'>
const form = reactive<{
  full_name: string
  email: string
  password: string
  passwordConfirm: string
  role: Role
}>({
  full_name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  role: 'penitip',
})

const errors = reactive<Record<string, string | undefined>>({})
const showPassword = ref(false)
const submitted = ref(false)
const needsConfirm = ref(false) // true jika harus verifikasi email dulu

const passwordsMatch = computed(() => form.password === form.passwordConfirm)

function validate() {
  errors.full_name = !form.full_name ? 'Nama lengkap wajib diisi'
                    : !minLen(form.full_name, 3) ? 'Nama minimal 3 karakter' : undefined
  errors.email = !form.email ? 'Email wajib diisi'
                : !isEmail(form.email) ? 'Format email tidak valid' : undefined
  errors.password = !form.password ? 'Password wajib diisi'
                  : !minLen(form.password, 6) ? 'Password minimal 6 karakter' : undefined
  errors.passwordConfirm = !form.passwordConfirm ? 'Konfirmasi password wajib diisi'
                         : !passwordsMatch.value ? 'Password tidak cocok' : undefined
  return !errors.full_name && !errors.email && !errors.password && !errors.passwordConfirm
}

async function submit() {
  if (!validate()) return
  try {
    const result = await auth.signUpWithEmail({
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      role: form.role,
    })

    if (result.session) {
      // Auto-login (Confirm email dimatikan)
      ui.success('Selamat datang! Akun Anda aktif.')
      // Redirect berdasarkan role
      router.push(form.role === 'pendoa' ? { name: 'pendoa-dashboard' } : { name: 'penitip-dashboard' })
    } else if (result.needsEmailConfirm) {
      // Perlu konfirmasi email
      needsConfirm.value = true
      submitted.value = true
      ui.success('Akun dibuat! Cek email untuk verifikasi.')
    }
  } catch (e) {
    const err = e as { message?: string; code?: string }
    ui.error(err.message ?? 'Gagal mendaftar')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-gold-50 px-4 py-8">
    <div class="w-full max-w-lg">
      <button class="flex items-center gap-2 mb-6 mx-auto" @click="router.push({ name: 'landing' })">
        <div class="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
          <Icon name="kaaba" :size="22" />
        </div>
        <div class="text-left">
          <p class="font-display font-bold text-emerald-900">Entrust Prayers</p>
          <p class="text-xs text-emerald-600">Titip doa ke Tanah Suci</p>
        </div>
      </button>

      <div v-if="!submitted" class="card animate-slide-up">
        <h1 class="text-2xl font-display font-bold text-emerald-900 text-center">Buat Akun Baru</h1>
        <p class="text-sm text-emerald-600 text-center mt-1 mb-6">Daftar untuk mulai menitipkan doa</p>

        <!-- Role selector -->
        <div class="mb-5">
          <label class="form-label">Saya mendaftar sebagai <span class="text-red-500">*</span></label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :class="[
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                form.role === 'penitip'
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                  : 'border-emerald-100 hover:border-emerald-300',
              ]"
              @click="form.role = 'penitip'"
            >
              <div :class="['h-10 w-10 rounded-xl flex items-center justify-center', form.role === 'penitip' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700']">
                <Icon name="send" :size="20" />
              </div>
              <div class="text-center">
                <p class="font-semibold text-sm text-emerald-900">Penitip Doa</p>
                <p class="text-xs text-emerald-600">Kirim doa ke pendoa</p>
              </div>
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Pendaftaran pendoa sementara ditutup"
              :class="[
                'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-not-allowed opacity-60 grayscale',
                'border-emerald-100 bg-emerald-50/40',
              ]"
              @click.prevent
            >
              <div class="absolute top-2 right-2">
                <span class="badge-gray text-[10px] uppercase tracking-wide">Ditutup</span>
              </div>
              <div class="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-400">
                <Icon name="kaaba" :size="20" />
              </div>
              <div class="text-center">
                <p class="font-semibold text-sm text-emerald-700">Pendoa</p>
                <p class="text-xs text-emerald-500">Sedang Haji/Umroh</p>
                <p class="text-[10px] text-emerald-600 mt-1 italic">Pendaftaran sementara ditutup</p>
              </div>
            </button>
          </div>
          <p class="form-hint mt-2 flex items-center gap-1">
            <Icon name="info" :size="12" />
            Saat ini pendaftaran sebagai pendoa sedang dinonaktifkan. Hubungi admin jika ingin mendaftar sebagai pendoa.
          </p>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <AppInput
            v-model="form.full_name"
            label="Nama Lengkap"
            placeholder="Ahmad Abdullah"
            autocomplete="name"
            required
            :error="errors.full_name"
          />

          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
            :error="errors.email"
          />

          <div>
            <label class="form-label">Password <span class="text-red-500">*</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                <Icon name="lock" :size="16" />
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Min. 6 karakter"
                autocomplete="new-password"
                required
                :class="['form-input pl-9 pr-10', errors.password ? 'form-input-error' : '']"
                @input="errors.password = undefined"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 hover:text-emerald-700"
                @click="showPassword = !showPassword"
              >
                <Icon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
            <p v-if="errors.password" class="form-error">{{ errors.password }}</p>
          </div>

          <AppInput
            v-model="form.passwordConfirm"
            label="Ulangi Password"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
            :error="errors.passwordConfirm"
          />

          <AppButton type="submit" block size="lg" :loading="auth.loading">
            <Icon name="plus" :size="18" />
            Daftar
          </AppButton>
        </form>

        <p class="text-center text-sm text-emerald-600 mt-6">
          Sudah punya akun?
          <router-link :to="{ name: 'login' }" class="text-emerald-700 font-semibold hover:underline">
            Masuk di sini
          </router-link>
        </p>
      </div>

      <!-- Success state -->
      <div v-else class="card text-center animate-slide-up">
        <div class="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
          <Icon name="check-circle" :size="32" />
        </div>
        <h2 class="text-2xl font-display font-bold text-emerald-900">Akun Dibuat!</h2>

        <p v-if="needsConfirm" class="text-sm text-emerald-600 mt-2">
          Kami telah mengirim email konfirmasi ke <strong>{{ form.email }}</strong>.
          Klik tautan di email tersebut, lalu masuk dengan akun baru Anda.
        </p>
        <p v-else class="text-sm text-emerald-600 mt-2">
          Akun Anda aktif. Silakan masuk dengan email & password yang baru saja Anda buat.
        </p>

        <div v-if="needsConfirm" class="mt-6 space-y-2">
          <AppButton variant="primary" block @click="router.push({ name: 'login' })">
            <Icon name="logout" :size="18" />
            Ke Halaman Masuk
          </AppButton>
          <AppButton variant="ghost" block @click="submitted = false">Kembali</AppButton>
        </div>
        <div v-else class="mt-6 space-y-2">
          <AppButton variant="primary" block @click="router.push({ name: 'login' })">
            <Icon name="logout" :size="18" />
            Masuk Sekarang
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
