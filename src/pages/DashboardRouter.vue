<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Spinner from '@/components/ui/Spinner.vue'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  await auth.init()
  if (!auth.isAuthenticated) {
    router.push({ name: 'login' })
    return
  }
  // Tunggu profile load untuk dapat role
  if (!auth.profile) await auth.loadProfile()
  if (auth.isAdmin) router.replace({ name: 'admin-dashboard' })
  else if (auth.isPendoa) router.replace({ name: 'pendoa-dashboard' })
  else if (auth.isPenitip) router.replace({ name: 'penitip-dashboard' })
  else router.replace({ name: 'profile-edit' })
})
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <Spinner size="lg" label="Memuat dashboard..." />
  </div>
</template>
