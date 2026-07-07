<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-emerald-50/40 bg-pattern-islamic px-4">
    <div class="text-center">
      <p class="font-display text-7xl font-bold text-emerald-300">404</p>
      <h1 class="mt-4 text-2xl font-bold text-emerald-900">Halaman tidak ditemukan</h1>
      <p class="mt-2 text-emerald-600">Maaf, halaman yang Anda cari tidak ada.</p>
      <div class="mt-6">
        <AppButton variant="primary" @click="router.push({ name: 'landing' })">
          <Icon name="home" :size="18" />
          Kembali ke Beranda
        </AppButton>
      </div>
    </div>
  </div>
</template>
