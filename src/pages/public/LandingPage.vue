<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import AppButton from '@/components/ui/AppButton.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const auth = useAuthStore()

function cta() {
  if (auth.isAuthenticated) router.push({ name: 'dashboard-default' })
  else router.push({ name: 'register' })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gold-50">
    <!-- Header -->
    <header class="border-b border-emerald-100/60 bg-white/60 backdrop-blur-md sticky top-0 z-10">
      <div class="container-page h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Icon name="kaaba" :size="20" />
          </div>
          <div class="leading-tight">
            <p class="font-display font-bold text-emerald-900">Entrust Prayers</p>
            <p class="text-xs text-emerald-600">Titip doa ke Tanah Suci</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <AppButton variant="ghost" @click="router.push({ name: 'login' })">Masuk</AppButton>
          <AppButton variant="primary" @click="router.push({ name: 'register' })">Daftar</AppButton>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="container-page py-16 sm:py-24 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm mb-6">
        <Icon name="sparkles" :size="14" />
        <span>Platform titip doa untuk jamaah Haji & Umroh</span>
      </div>
      <h1 class="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-900 leading-tight">
        Sampaikan doa Anda,<br />
        <span class="bg-gradient-to-r from-emerald-600 to-gold-500 bg-clip-text text-transparent">
          dititipkan di Tanah Suci
        </span>
      </h1>
      <p class="mt-6 text-lg text-emerald-700 max-w-2xl mx-auto leading-relaxed">
        Pertemukan niat tulus Anda dengan jamaah yang sedang menunaikan ibadah.
        Titipkan doa, dan terima kabar ketika doa Anda telah didoakan di Baitullah.
      </p>
      <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <AppButton variant="primary" size="lg" @click="cta">
          <Icon name="send" :size="18" />
          Mulai Titip Doa
        </AppButton>
        <AppButton variant="secondary" size="lg" @click="router.push({ name: 'login' })">
          Saya sudah punya akun
        </AppButton>
      </div>

      <!-- Arabic ornament -->
      <p class="mt-10 font-arabic text-2xl text-emerald-700" dir="rtl">
        وَأَنَّ هَٰذَا صِرَاطِي مُسْتَقِيمًا فَاتَّبِعُوهُ
      </p>
    </section>

    <!-- Features -->
    <section class="container-page py-16">
      <div class="grid sm:grid-cols-3 gap-6">
        <div class="card-hover text-center">
          <div class="h-12 w-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <Icon name="send" :size="24" />
          </div>
          <h3 class="font-semibold text-emerald-900 text-lg">Kirim Doa</h3>
          <p class="text-sm text-emerald-600 mt-1">
            Tuliskan doa Anda — untuk kesehatan, pekerjaan, keluarga, jodoh, atau orang tua.
          </p>
        </div>
        <div class="card-hover text-center">
          <div class="h-12 w-12 mx-auto rounded-2xl bg-gold-100 text-gold-700 flex items-center justify-center mb-4">
            <Icon name="kaaba" :size="24" />
          </div>
          <h3 class="font-semibold text-emerald-900 text-lg">Pilih Pendoa</h3>
          <p class="text-sm text-emerald-600 mt-1">
            Pilih jamaah Haji atau Umroh yang sedang aktif di Tanah Suci.
          </p>
        </div>
        <div class="card-hover text-center">
          <div class="h-12 w-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <Icon name="check-circle" :size="24" />
          </div>
          <h3 class="font-semibold text-emerald-900 text-lg">Dapatkan Kabar</h3>
          <p class="text-sm text-emerald-600 mt-1">
            Terima notifikasi realtime ketika doa Anda sudah didoakan.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA Footer -->
    <section class="container-page py-16">
      <div class="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 sm:p-12 text-center text-white shadow-xl">
        <h2 class="font-display text-3xl sm:text-4xl font-bold">Siap memulai?</h2>
        <p class="mt-3 text-emerald-100 max-w-xl mx-auto">
          Bergabung hari ini. Daftar sebagai penitip doa atau sebagai pendoa jamaah.
        </p>
        <div class="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <AppButton variant="gold" size="lg" @click="router.push({ name: 'register' })">
            Daftar Sekarang
          </AppButton>
        </div>
      </div>
    </section>

    <footer class="border-t border-emerald-100 py-6">
      <p class="text-center text-sm text-emerald-600">
        © 2026 Entrust Prayers · Dibuat dengan ♥ untuk sesama Muslim
      </p>
    </footer>
  </div>
</template>
