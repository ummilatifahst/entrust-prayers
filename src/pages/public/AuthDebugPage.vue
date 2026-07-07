<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { supabase } from '@/services/supabase'

const checking = ref(true)
const results = ref<Array<{ test: string; ok: boolean; detail: string }>>([])

async function check() {
  checking.value = true
  results.value = []

  // 1. Cek env
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  results.value.push({
    test: 'VITE_SUPABASE_URL',
    ok: !!url && url.startsWith('http'),
    detail: url ? String(url) : '(kosong)',
  })
  const keyFormat = !key
    ? '(kosong)'
    : key.startsWith('sb_publishable_')
    ? 'format baru (publishable)'
    : key.startsWith('eyJ')
    ? 'format lama (JWT anon)'
    : 'tidak dikenal'

  results.value.push({
    test: 'VITE_SUPABASE_ANON_KEY',
    ok: !!key && key.length > 30,
    detail: key ? `${key.slice(0, 15)}... (${key.length} chars, ${keyFormat})` : '(kosong)',
  })

  // 2. Cek koneksi ke Supabase (GET /auth/v1/health)
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    })
    results.value.push({
      test: 'Auth endpoint reachable',
      ok: res.ok,
      detail: `HTTP ${res.status}`,
    })
  } catch (e) {
    results.value.push({
      test: 'Auth endpoint reachable',
      ok: false,
      detail: (e as Error).message,
    })
  }

  // 3. Cek session yang tersimpan
  const { data: { session } } = await supabase.auth.getSession()
  results.value.push({
    test: 'Session aktif',
    ok: !!session,
    detail: session ? `User: ${session.user.email}` : 'Tidak ada session',
  })

  // 4. Cek list users (anon tidak bisa, tapi lihat error-nya)
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    results.value.push({
      test: 'Profiles table accessible',
      ok: !error,
      detail: error ? error.message : 'OK',
    })
  } catch (e) {
    results.value.push({
      test: 'Profiles table accessible',
      ok: false,
      detail: (e as Error).message,
    })
  }

  checking.value = false
}

onMounted(check)
</script>

<template>
  <div class="min-h-screen bg-emerald-50/40 px-4 py-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold text-emerald-900 mb-2">Auth Diagnostics</h1>
      <p class="text-sm text-emerald-600 mb-6">
        Halaman ini memeriksa konfigurasi Supabase. Buka setelah error login untuk melihat detail.
      </p>

      <div class="card space-y-3">
        <p v-if="checking" class="text-sm text-emerald-700">Menguji...</p>

        <div
          v-for="r in results"
          :key="r.test"
          class="flex items-start gap-3 p-3 rounded-xl border"
          :class="r.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'"
        >
          <div
            class="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
            :class="r.ok ? 'bg-emerald-600' : 'bg-red-600'"
          >
            {{ r.ok ? '✓' : '✗' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-emerald-900">{{ r.test }}</p>
            <p class="text-xs text-emerald-700 mt-0.5 break-all">{{ r.detail }}</p>
          </div>
        </div>
      </div>

      <div class="card mt-6">
        <h2 class="font-semibold text-emerald-900 mb-2">Kemungkinan Penyebab Error 400</h2>
        <ol class="list-decimal list-inside text-sm text-emerald-700 space-y-1">
          <li><strong>Email belum dikonfirmasi</strong> — cek inbox, atau disable "Confirm email" di Supabase → Authentication → Settings.</li>
          <li><strong>Akun belum terdaftar</strong> — daftar dulu via halaman Register.</li>
          <li><strong>Password salah</strong> — ketik ulang / gunakan fitur lupa password.</li>
          <li><strong>Anon key salah</strong> — copy ulang dari Supabase → Settings → API.</li>
        </ol>
      </div>
    </div>
  </div>
</template>
