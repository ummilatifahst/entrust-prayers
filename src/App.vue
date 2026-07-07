<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import RealtimeNotifications from '@/components/layouts/RealtimeNotifications.vue'

const auth = useAuthStore()
const notifications = useNotificationStore()

onMounted(async () => {
  await auth.init()
  if (auth.isAuthenticated) {
    notifications.load()
  }
})
</script>

<template>
  <router-view />
  <ToastContainer />
  <RealtimeNotifications />
</template>
